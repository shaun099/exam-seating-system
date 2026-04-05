from io import BytesIO
import re
import zipfile

from fastapi import HTTPException
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.models.allocation import Allocation, AllocationExam
from app.models.course import Course
from app.models.exam import Exam
from app.models.room import Room
from app.models.seat_allocation import SeatAllocation
from app.models.student import Student
from app.schemas.class_matrix import ReplaceRoomPayload

MIXED_COL_COLORS = [
    colors.HexColor("#D6E4F0"),
    colors.HexColor("#D5F5E3"),
    colors.HexColor("#FDEBD0"),
    colors.HexColor("#F9EBEA"),
]
HEADER_ROW_BG = colors.lightgrey


class ClassMatrixService:
    COLLEGE_NAME = "ST. JOSEPH'S COLLEGE OF ENGINEERING & TECHNOLOGY, PALAI"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _safe_filename(value: str) -> str:
        safe = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
        return safe or "file"

    @staticmethod
    def _col_label(index: int) -> str:
        label = ""
        value = index + 1
        while value > 0:
            value, remainder = divmod(value - 1, 26)
            label = chr(65 + remainder) + label
        return label

    @staticmethod
    def _format_course_code(code: str) -> str:
        return re.sub(r"([A-Za-z]+)(\d+)", r"\1 \2", code.strip())

    # ------------------------------------------------------------------
    # DB fetch — joins through AllocationExam (no Allocation.exam_id)
    # ------------------------------------------------------------------

    @staticmethod
    def _fetch_room_rows_for_sem_slot(
        sem: str, slot: str, db: Session
    ) -> tuple[dict, list, dict]:
        normalized_sem  = sem.strip().upper()
        normalized_slot = slot.strip().upper()

        # Find all allocations for this sem + slot via AllocationExam join
        allocations = (
            db.query(Allocation)
            .join(AllocationExam, AllocationExam.allocation_id == Allocation.id)
            .join(Exam, Exam.id == AllocationExam.exam_id)
            .filter(Allocation.slot == normalized_slot)
            .filter(Exam.event_name.ilike(f"%{normalized_sem}%"))
            .order_by(Allocation.id.asc())
            .distinct()
            .all()
        )

        if not allocations:
            raise HTTPException(
                status_code=404,
                detail=f"No allocation found for sem '{normalized_sem}' and slot '{normalized_slot}'",
            )

        allocation_ids = [a.id for a in allocations]

        # Fetch all AllocationExam rows for these allocations in one query
        allocation_exam_rows = (
            db.query(AllocationExam.allocation_id, AllocationExam.exam_id)
            .filter(AllocationExam.allocation_id.in_(allocation_ids))
            .all()
        )

        # allocation_id → list of exam_ids
        alloc_to_exam_ids: dict[int, list[int]] = {}
        all_exam_ids: set[int] = set()
        for ae in allocation_exam_rows:
            alloc_to_exam_ids.setdefault(ae.allocation_id, []).append(ae.exam_id)
            all_exam_ids.add(ae.exam_id)

        # Fetch all linked exams in one query
        exams = db.query(Exam).filter(Exam.id.in_(all_exam_ids)).all()
        exam_map: dict[int, Exam] = {e.id: e for e in exams}

        # Pick display event_name per allocation — prefer (R) over (S)
        def pick_event_name(exam_ids: list[int]) -> str:
            linked = [exam_map[eid] for eid in exam_ids if eid in exam_map]
            for e in linked:
                if "(R)" in e.event_name:
                    return e.event_name
            return linked[0].event_name if linked else ""

        # allocation_id → event_name
        allocation_event_map: dict[int, str] = {
            a.id: pick_event_name(alloc_to_exam_ids.get(a.id, []))
            for a in allocations
        }

        # Primary allocation supplies base date/sem/slot for the response
        primary_alloc    = allocations[0]
        primary_exam_ids = alloc_to_exam_ids.get(primary_alloc.id, [])
        primary_exam     = next(
            (exam_map[eid] for eid in primary_exam_ids if eid in exam_map), None
        )
        if primary_exam is None:
            raise HTTPException(
                status_code=404,
                detail="Could not resolve exam for primary allocation.",
            )

        base_exam_payload = {
            "event_name": allocation_event_map[primary_alloc.id],
            "date":       str(primary_exam.date),
            "sem":        normalized_sem,
            "slot":       normalized_slot,
        }

        # Fetch all seat rows across every matched allocation
        rows = (
            db.query(
                Room.id.label("room_id"),
                Room.room_number,
                Room.rows,
                Room.cols,
                SeatAllocation.row,
                SeatAllocation.col,
                SeatAllocation.allocation_id,
                Student.reg_no,
                Student.name.label("student_name"),
                Course.code.label("course_code"),
                Course.id.label("course_id"),
            )
            .join(SeatAllocation, SeatAllocation.room_id == Room.id)
            .join(Student,        Student.id == SeatAllocation.student_id)
            .join(Course,         Course.id  == SeatAllocation.course_id)
            .filter(SeatAllocation.allocation_id.in_(allocation_ids))
            .order_by(Room.room_number, SeatAllocation.row, SeatAllocation.col)
            .all()
        )

        if not rows:
            raise HTTPException(status_code=404, detail="No seat allocation rows found")

        return base_exam_payload, rows, allocation_event_map

    # ------------------------------------------------------------------
    # Build per-room payloads
    # ------------------------------------------------------------------

    @staticmethod
    def _build_room_payloads(
        base_exam_payload: dict,
        rows: list,
        allocation_event_map: dict[int, str],
    ) -> list[dict]:
        grouped: dict[int, dict] = {}

        for entry in rows:
            room_id = entry.room_id
            if room_id not in grouped:
                grouped[room_id] = {
                    "room": {
                        "id":          room_id,
                        "room_number": entry.room_number,
                        "rows":        entry.rows,
                        "cols":        entry.cols,
                    },
                    "cells":              {},
                    "first_allocation_id": entry.allocation_id,
                }

            grouped[room_id]["cells"][(entry.row, entry.col)] = {
                "reg_no":       entry.reg_no,
                "student_name": entry.student_name,
                "course_code":  entry.course_code,
                "course_id":    entry.course_id,
            }

        room_payloads = []
        for room_group in grouped.values():
            first_alloc_id  = room_group["first_allocation_id"]
            room_event_name = allocation_event_map.get(
                first_alloc_id, base_exam_payload["event_name"]
            )
            room_exam = dict(base_exam_payload)
            room_exam["event_name"] = room_event_name

            room_payloads.append({
                "exam": room_exam,
                "room": room_group["room"],
                "cells": room_group["cells"],
            })

        room_payloads.sort(key=lambda item: str(item["room"]["room_number"]))
        return room_payloads

    # ------------------------------------------------------------------
    # Column analysis helper
    # ------------------------------------------------------------------

    @staticmethod
    def _analyse_columns(
        cells: dict, rows_count: int, cols_count: int
    ) -> tuple[list, list, dict, int, int]:
        student_grid: list[list[str]] = [[""] * cols_count for _ in range(rows_count)]
        total_count   = 0
        last_filled_row = -1

        for row_idx in range(rows_count):
            for col_idx in range(cols_count):
                seat = cells.get((row_idx, col_idx))
                if seat is None:
                    continue
                student_grid[row_idx][col_idx] = seat["reg_no"] or ""
                total_count += 1
                if row_idx > last_filled_row:
                    last_filled_row = row_idx

        effective_rows = last_filled_row + 1 if last_filled_row >= 0 else 0

        course_header_by_col: list[str]                      = [""] * cols_count
        col_segment_map:      dict[int, list[tuple[int, str]]] = {}

        for col_idx in range(cols_count):
            segments:     list[tuple[int, str]] = []
            current_code: str | None            = None

            for row_idx in range(rows_count):
                seat = cells.get((row_idx, col_idx))
                if seat is None:
                    continue
                code = seat["course_code"] or ""
                if code != current_code:
                    segments.append((row_idx, code))
                    current_code = code

            unique_codes = list(dict.fromkeys(seg[1] for seg in segments))
            fmt = ClassMatrixService._format_course_code
            if len(unique_codes) == 1:
                course_header_by_col[col_idx] = fmt(unique_codes[0])
            else:
                course_header_by_col[col_idx] = "\n".join(fmt(c) for c in unique_codes)
                col_segment_map[col_idx]       = segments

        return course_header_by_col, student_grid, col_segment_map, total_count, effective_rows

    # ------------------------------------------------------------------
    # PDF builder
    # ------------------------------------------------------------------

    @staticmethod
    def _build_class_matrix_pdf(room_payload: dict) -> bytes:
        exam  = room_payload["exam"]
        room  = room_payload["room"]
        cells = room_payload["cells"]

        rows_count = max((r for r, c in cells.keys()), default=0) + 1
        cols_count = max((c for r, c in cells.keys()), default=0) + 1

        (
            course_header_by_col,
            student_grid,
            col_segment_map,
            total_count,
            effective_rows,
        ) = ClassMatrixService._analyse_columns(cells, rows_count, cols_count)

        header_labels = ["No"] + [ClassMatrixService._col_label(i) for i in range(cols_count)]

        cell_style = ParagraphStyle(
            "CourseCell", fontName="Helvetica-Bold",
            fontSize=8, leading=11, alignment=1,
        )

        def _make_course_cell(text: str):
            if "\n" in text:
                return Paragraph("<br/>".join(text.split("\n")), cell_style)
            return text

        course_row = ["1"] + [_make_course_cell(h) for h in course_header_by_col]
        table_data = [header_labels, course_row]
        for row_idx in range(effective_rows):
            table_data.append([str(row_idx + 1)] + student_grid[row_idx])

        total_row = [""] * (cols_count + 1)
        total_row[-2] = "TOTAL COUNT:"
        total_row[-1] = str(total_count)
        table_data.append(total_row)
        total_row_index = len(table_data) - 1

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            leftMargin=10*mm, rightMargin=10*mm,
            topMargin=8*mm,   bottomMargin=10*mm,
        )

        styles        = getSampleStyleSheet()
        center_title  = ParagraphStyle("CenterTitle",    parent=styles["Title"],  alignment=1, fontName="Helvetica-Bold", fontSize=12, leading=14)
        center_sub    = ParagraphStyle("CenterSubtitle", parent=styles["Normal"], alignment=1, fontName="Helvetica-Bold", fontSize=10, leading=12)

        story = [
            Paragraph(ClassMatrixService.COLLEGE_NAME, center_title),
            Paragraph(exam["event_name"],               center_sub),
            Paragraph("SEATING ARRANGEMENT",            center_sub),
            Paragraph(str(room["room_number"]),         center_sub),
            Paragraph(f"{exam['date']} {exam['slot']}", center_sub),
            Spacer(1, 8),
        ]

        first_col_width = 25
        available_width = A4[0] - (20 * mm)
        data_col_width  = max((available_width - first_col_width) / max(cols_count, 1), 55)
        col_widths      = [first_col_width] + [data_col_width] * cols_count

        table = Table(table_data, colWidths=col_widths)

        table_style_cmds = [
            ("GRID",       (0, 0), (-1, -1),            0.8, colors.black),
            ("ALIGN",      (0, 0), (-1, -1),            "CENTER"),
            ("VALIGN",     (0, 0), (-1, -1),            "MIDDLE"),
            ("FONTNAME",   (0, 0), (-1, 0),             "Helvetica-Bold"),
            ("FONTNAME",   (0, 1), (-1, 1),             "Helvetica-Bold"),
            ("BACKGROUND", (0, 1), (-1, 1),             HEADER_ROW_BG),
            ("FONTNAME",   (0, total_row_index), (-1, total_row_index), "Helvetica-Bold"),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]

        if cols_count >= 2:
            table_style_cmds.extend([
                ("SPAN",  (1, total_row_index), (max(cols_count - 2, 1), total_row_index)),
                ("ALIGN", (max(cols_count - 1, 1), total_row_index), (-1, total_row_index), "CENTER"),
            ])

        for col_idx, segments in col_segment_map.items():
            table_col = col_idx + 1
            for seg_order, (start_abs_row, _) in enumerate(segments):
                bg = MIXED_COL_COLORS[seg_order % len(MIXED_COL_COLORS)]
                end_abs_row = (
                    segments[seg_order + 1][0] - 1
                    if seg_order + 1 < len(segments)
                    else effective_rows - 1
                )
                table_style_cmds.append((
                    "BACKGROUND",
                    (table_col, start_abs_row + 2),
                    (table_col, end_abs_row   + 2),
                    bg,
                ))
            table_style_cmds.append(
                ("BACKGROUND", (table_col, 1), (table_col, 1), MIXED_COL_COLORS[0])
            )

        table.setStyle(TableStyle(table_style_cmds))
        story.append(table)
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    # ------------------------------------------------------------------
    # Preview response builder
    # ------------------------------------------------------------------

    @staticmethod
    def build_preview_response(
        room_payloads: list[dict], base_exam: dict
    ) -> dict:
        rooms_out = []
        for rp in room_payloads:
            room       = rp["room"]
            cells      = rp["cells"]
            rows_count = max((r for r, _ in cells.keys()), default=0) + 1
            cols_count = max((c for _, c in cells.keys()), default=0) + 1

            _, _, _, total_count, _ = ClassMatrixService._analyse_columns(
                cells, rows_count, cols_count
            )

            cells_out = {
                f"{r},{c}": {
                    "reg_no":       v["reg_no"],
                    "student_name": v["student_name"],
                    "course_code":  v["course_code"],
                }
                for (r, c), v in cells.items()
            }

            seen: set[str]    = set()
            courses: list[str] = []
            for (r, c) in sorted(cells.keys()):
                code = cells[(r, c)]["course_code"]
                if code and code not in seen:
                    seen.add(code)
                    courses.append(code)

            rooms_out.append({
                "room_id":     room["id"],
                "room_number": room["room_number"],
                "rows":        rows_count,
                "cols":        cols_count,
                "event_name":  rp["exam"]["event_name"],
                "courses":     courses,
                "cells":       cells_out,
                "total_count": total_count,
            })

        return {
            "event_name": base_exam["event_name"],
            "date":       base_exam["date"],
            "sem":        base_exam["sem"],
            "slot":       base_exam["slot"],
            "rooms":      rooms_out,
        }

    # ------------------------------------------------------------------
    # Replace room — joins through AllocationExam
    # ------------------------------------------------------------------

    @staticmethod
    def replace_room(payload: ReplaceRoomPayload, db: Session) -> None:
        normalized_sem  = payload.sem.strip().upper()
        normalized_slot = payload.slot.strip().upper()

        new_room = (
            db.query(Room)
            .filter(Room.room_number == payload.new_room_number.strip())
            .first()
        )
        if new_room is None:
            raise HTTPException(
                status_code=404,
                detail=f"Room '{payload.new_room_number}' not found.",
            )

        allocations = (
            db.query(Allocation)
            .join(AllocationExam, AllocationExam.allocation_id == Allocation.id)
            .join(Exam, Exam.id == AllocationExam.exam_id)
            .filter(Allocation.slot == normalized_slot)
            .filter(Exam.event_name.ilike(f"%{normalized_sem}%"))
            .distinct()
            .all()
        )
        if not allocations:
            raise HTTPException(
                status_code=404,
                detail="No allocation found for this sem/slot.",
            )

        allocation_ids = [a.id for a in allocations]

        old_seats = (
            db.query(SeatAllocation)
            .filter(
                SeatAllocation.room_id == payload.old_room_id,
                SeatAllocation.allocation_id.in_(allocation_ids),
            )
            .all()
        )
        if not old_seats:
            raise HTTPException(
                status_code=404,
                detail=f"No seat allocations found for room_id {payload.old_room_id} in this sem/slot.",
            )

        for seat in old_seats:
            seat.room_id = new_room.id

        db.commit()

    # ------------------------------------------------------------------
    # ZIP entry point
    # ------------------------------------------------------------------

    @staticmethod
    def get_class_matrix_zip(sem: str, slot: str, db: Session) -> tuple[bytes, str]:
        base_exam_payload, rows, allocation_event_map = (
            ClassMatrixService._fetch_room_rows_for_sem_slot(sem=sem, slot=slot, db=db)
        )
        room_payloads = ClassMatrixService._build_room_payloads(
            base_exam_payload, rows, allocation_event_map
        )

        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for room_payload in room_payloads:
                room_number  = ClassMatrixService._safe_filename(str(room_payload["room"]["room_number"]))
                pdf_filename = f"class_matrix_{room_number}_{base_exam_payload['slot']}.pdf"
                zf.writestr(pdf_filename, ClassMatrixService._build_class_matrix_pdf(room_payload))

        zip_buffer.seek(0)
        zip_name = (
            f"class_matrix_{ClassMatrixService._safe_filename(base_exam_payload['sem'])}_"
            f"{ClassMatrixService._safe_filename(base_exam_payload['slot'])}.zip"
        )
        return zip_buffer.getvalue(), zip_name