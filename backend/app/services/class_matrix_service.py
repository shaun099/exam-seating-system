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

from app.models.allocation import Allocation
from app.models.course import Course
from app.models.exam import Exam
from app.models.room import Room
from app.models.seat_allocation import SeatAllocation
from app.models.student import Student
from app.schemas.class_matrix import ReplaceRoomPayload   # add this to your imports at top

# Colors for alternating course groups within a mixed column
MIXED_COL_COLORS = [
    colors.HexColor("#D6E4F0"),  # light blue  – first course group
    colors.HexColor("#D5F5E3"),  # light green – second course group
    colors.HexColor("#FDEBD0"),  # light orange – third (rare)
    colors.HexColor("#F9EBEA"),  # light red   – fourth (rare)
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
    def _extract_sem(event_name: str) -> str | None:
        match = re.search(r"\bS\d+\b", event_name.upper())
        return match.group(0) if match else None

    @staticmethod
    def _format_course_code(code: str) -> str:
        """Insert a space between the letter prefix and the numeric suffix.
        e.g. 'CST202' -> 'CST 202', 'ECT404' -> 'ECT 404'.
        Codes that are already spaced or don't match are returned unchanged.
        """
        return re.sub(r"([A-Za-z]+)(\d+)", r"\1 \2", code.strip())

    # ------------------------------------------------------------------
    # DB fetch  -- KEY FIX: fetch ALL allocations for this sem+slot
    # ------------------------------------------------------------------

    @staticmethod
    def _fetch_room_rows_for_sem_slot(
        sem: str, slot: str, db: Session
    ) -> tuple[dict, list, dict]:
        """
        Returns
        -------
        base_exam_payload     : dict  – event_name/date/sem/slot from primary allocation
        rows                  : list  – all seat rows across every matched allocation
        allocation_event_map  : dict  – {allocation_id: event_name} cache (no extra DB hits)
        """
        normalized_sem = sem.strip().upper()
        normalized_slot = slot.strip().upper()

        # Find ALL allocations that match this sem + slot.
        # Previously only .first() was used, which meant every seat row
        # shared the same allocation_id and therefore the same event_name.
        allocations = (
            db.query(Allocation)
            .join(Exam, Exam.id == Allocation.exam_id)
            .filter(Allocation.slot == normalized_slot)
            .filter(Exam.event_name.ilike(f"%{normalized_sem}%"))
            .order_by(Allocation.id.asc())
            .all()
        )

        if not allocations:
            raise HTTPException(
                status_code=404,
                detail=f"No allocation found for sem '{normalized_sem}' and slot '{normalized_slot}'",
            )

        # Build allocation_id -> event_name map in one round-trip
        exam_ids = list({a.exam_id for a in allocations})
        exams = db.query(Exam).filter(Exam.id.in_(exam_ids)).all()
        exam_map: dict[int, Exam] = {e.id: e for e in exams}

        allocation_event_map: dict[int, str] = {
            a.id: (exam_map[a.exam_id].event_name if a.exam_id in exam_map else "")
            for a in allocations
        }

        # Primary allocation (first by id) supplies base date/sem/slot
        primary_alloc = allocations[0]
        primary_exam = exam_map[primary_alloc.exam_id]
        base_exam_payload = {
            "event_name": primary_exam.event_name,
            "date": str(primary_exam.date),
            "sem": normalized_sem,
            "slot": normalized_slot,
        }

        allocation_ids = [a.id for a in allocations]

        # Fetch seat rows from ALL matched allocations (was single allocation_id before)
        rows = (
            db.query(
                Room.id.label("room_id"),
                Room.room_number,
                Room.rows,
                Room.cols,
                SeatAllocation.row,
                SeatAllocation.col,
                SeatAllocation.allocation_id,   # kept per-row for per-room event_name
                Student.reg_no,
                Student.name.label("student_name"),
                Course.code.label("course_code"),
                Course.id.label("course_id"),
            )
            .join(SeatAllocation, SeatAllocation.room_id == Room.id)
            .join(Student, Student.id == SeatAllocation.student_id)
            .join(Course, Course.id == SeatAllocation.course_id)
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
        """
        Groups seat rows by room.
        Per-room event_name = event_name of the first student's allocation_id
        in that room, resolved via the pre-built allocation_event_map cache.
        """
        grouped: dict[int, dict] = {}

        for entry in rows:
            room_id = entry.room_id
            if room_id not in grouped:
                grouped[room_id] = {
                    "room": {
                        "id": room_id,
                        "room_number": entry.room_number,
                        "rows": entry.rows,
                        "cols": entry.cols,
                    },
                    "cells": {},
                    # Rows are ordered by (room_number, row, col), so this is
                    # genuinely the first seated student in this room.
                    "first_allocation_id": entry.allocation_id,
                }

            grouped[room_id]["cells"][(entry.row, entry.col)] = {
                "reg_no": entry.reg_no,
                "student_name": entry.student_name,
                "course_code": entry.course_code,
                "course_id": entry.course_id,
            }

        room_payloads = []
        for room_group in grouped.values():
            first_alloc_id = room_group["first_allocation_id"]

            # O(1) lookup – no extra DB call needed
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
        """
        Returns
        -------
        course_header_by_col : list[str]
            "CST202" for a pure column, "CST202 / CET202" for mixed
        student_grid         : list[list[str]]
            reg_no at [row][col]
        col_segment_map      : dict[int, list[tuple[int, str]]]
            {col_idx: [(first_abs_row, course_code), ...]} only for mixed cols
        total_count          : int
        effective_rows       : int
        """
        student_grid: list[list[str]] = [[""] * cols_count for _ in range(rows_count)]
        total_count = 0
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

        course_header_by_col: list[str] = [""] * cols_count
        col_segment_map: dict[int, list[tuple[int, str]]] = {}

        for col_idx in range(cols_count):
            segments: list[tuple[int, str]] = []
            current_code: str | None = None

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
                # Mixed: newline-separated so PDF renders them stacked
                course_header_by_col[col_idx] = "\n".join(fmt(c) for c in unique_codes)
                col_segment_map[col_idx] = segments

        return course_header_by_col, student_grid, col_segment_map, total_count, effective_rows

    # ------------------------------------------------------------------
    # PDF builder
    # ------------------------------------------------------------------

    @staticmethod
    def _build_class_matrix_pdf(room_payload: dict) -> bytes:
        exam = room_payload["exam"]
        room = room_payload["room"]
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

        # ── Table rows ────────────────────────────────────────────────────
        header_labels = ["No"] + [ClassMatrixService._col_label(i) for i in range(cols_count)]

        # Build the course-header row.
        # Single-code cells stay as plain strings.
        # Multi-code cells (mixed columns) are rendered as Paragraph objects
        # so ReportLab wraps them onto separate lines ("CST 202\nECT 404").
        cell_style = ParagraphStyle(
            "CourseCell",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            alignment=1,  # centre
        )

        def _make_course_cell(text: str):
            if "\n" in text:
                html = "<br/>".join(text.split("\n"))
                return Paragraph(html, cell_style)
            return text

        course_row = ["1"] + [_make_course_cell(h) for h in course_header_by_col]

        table_data = [header_labels, course_row]
        for row_idx in range(effective_rows):
            table_data.append([str(row_idx + 1)] + student_grid[row_idx])

        # Footer: blank cells, then "TOTAL COUNT:" and value in last two cols
        total_row = [""] * (cols_count + 1)
        total_row[-2] = "TOTAL COUNT:"
        total_row[-1] = str(total_count)
        table_data.append(total_row)
        total_row_index = len(table_data) - 1

        # ── Document setup ────────────────────────────────────────────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=10 * mm,
            rightMargin=10 * mm,
            topMargin=8 * mm,
            bottomMargin=10 * mm,
        )

        styles = getSampleStyleSheet()
        center_title = ParagraphStyle(
            "CenterTitle",
            parent=styles["Title"],
            alignment=1,
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
        )
        center_subtitle = ParagraphStyle(
            "CenterSubtitle",
            parent=styles["Normal"],
            alignment=1,
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
        )

        story = [
            Paragraph(ClassMatrixService.COLLEGE_NAME, center_title),
            Paragraph(exam["event_name"], center_subtitle),
            Paragraph("SEATING ARRANGEMENT", center_subtitle),
            Paragraph(str(room["room_number"]), center_subtitle),
            Paragraph(f"{exam['date']} {exam['slot']}", center_subtitle),
            Spacer(1, 8),
        ]

        first_col_width = 25
        available_width = A4[0] - (20 * mm)
        data_col_width  = max((available_width - first_col_width) / max(cols_count, 1), 55)
        col_widths = [first_col_width] + [data_col_width] * cols_count

        table = Table(table_data, colWidths=col_widths)

        # ── Base style commands ───────────────────────────────────────────
        table_style_cmds = [
            ("GRID",       (0, 0), (-1, -1),            0.8, colors.black),
            ("ALIGN",      (0, 0), (-1, -1),            "CENTER"),
            ("VALIGN",     (0, 0), (-1, -1),            "MIDDLE"),
            ("FONTNAME",   (0, 0), (-1, 0),             "Helvetica-Bold"),   # letter header
            ("FONTNAME",   (0, 1), (-1, 1),             "Helvetica-Bold"),   # course header
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

        # ── Mixed-column segment coloring ─────────────────────────────────
        # Table row 0 = letter header, row 1 = course header, row 2+ = data.
        for col_idx, segments in col_segment_map.items():
            table_col = col_idx + 1   # +1 because col 0 is "No"

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

            # Tint the course-header cell with the first segment color
            table_style_cmds.append((
                "BACKGROUND", (table_col, 1), (table_col, 1), MIXED_COL_COLORS[0]
            ))

        table.setStyle(TableStyle(table_style_cmds))
        story.append(table)
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Preview response builder (no PDF, returns JSON)
    # ------------------------------------------------------------------

    @staticmethod
    def build_preview_response(
        room_payloads: list[dict], base_exam: dict
    ) -> dict:
        rooms_out = []

        for rp in room_payloads:
            room  = rp["room"]
            cells = rp["cells"]
            rows_count = max((r for r, _ in cells.keys()), default=0) + 1
            cols_count = max((c for _, c in cells.keys()), default=0) + 1

            _, _, _, total_count, _ = ClassMatrixService._analyse_columns(
                cells, rows_count, cols_count
            )

            # (row, col) tuple keys → "row,col" string keys for JSON
            cells_out = {
                f"{r},{c}": {
                    "reg_no":       v["reg_no"],
                    "student_name": v["student_name"],
                    "course_code":  v["course_code"],
                }
                for (r, c), v in cells.items()
            }

            # Unique course codes in row-major order
            seen: set[str]   = set()
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
    # Replace room  (swaps room_id on existing seat rows, no re-shuffle)
    # ------------------------------------------------------------------

    @staticmethod
    def replace_room(payload: ReplaceRoomPayload, db: Session) -> None:
        normalized_sem  = payload.sem.strip().upper()
        normalized_slot = payload.slot.strip().upper()

        # 1. Verify the new room exists
        new_room = (
            db.query(Room)
            .filter(Room.room_number == payload.new_room_number.strip())
            .first()
        )
        if new_room is None:
            raise HTTPException(
                status_code=404,
                detail=f"Room '{payload.new_room_number}' not found. Add it via room management first.",
            )

        # 2. Resolve allocation_ids for this sem + slot
        allocations = (
            db.query(Allocation)
            .join(Exam, Exam.id == Allocation.exam_id)
            .filter(Allocation.slot == normalized_slot)
            .filter(Exam.event_name.ilike(f"%{normalized_sem}%"))
            .all()
        )
        if not allocations:
            raise HTTPException(
                status_code=404,
                detail="No allocation found for this sem/slot.",
            )

        allocation_ids = [a.id for a in allocations]

        # 3. Fetch every seat row in the old room for this sem/slot
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

        # 4. Point every seat row at the new room (layout/positions preserved)
        for seat in old_seats:
            seat.room_id = new_room.id

        db.commit()


    @staticmethod
    def get_class_matrix_zip(sem: str, slot: str, db: Session) -> tuple[bytes, str]:
        base_exam_payload, rows, allocation_event_map = (
            ClassMatrixService._fetch_room_rows_for_sem_slot(sem=sem, slot=slot, db=db)
        )
        room_payloads = ClassMatrixService._build_room_payloads(
            base_exam_payload, rows, allocation_event_map
        )

        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
            for room_payload in room_payloads:
                room_number = ClassMatrixService._safe_filename(
                    str(room_payload["room"]["room_number"])
                )
                pdf_filename = f"class_matrix_{room_number}_{base_exam_payload['slot']}.pdf"
                pdf_bytes    = ClassMatrixService._build_class_matrix_pdf(room_payload)
                zip_file.writestr(pdf_filename, pdf_bytes)

        zip_buffer.seek(0)
        zip_name = (
            f"class_matrix_{ClassMatrixService._safe_filename(base_exam_payload['sem'])}_"
            f"{ClassMatrixService._safe_filename(base_exam_payload['slot'])}.zip"
        )
        return zip_buffer.getvalue(), zip_name