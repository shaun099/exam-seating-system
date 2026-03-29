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


class ClassMatrixService:
    COLLEGE_NAME = "ST. JOSEPH'S COLLEGE OF ENGINEERING & TECHNOLOGY, PALAI"

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
        if not match:
            return None
        return match.group(0)

    @staticmethod
    def _fetch_room_rows_for_sem_slot(sem: str, slot: str, db: Session) -> tuple[dict, list]:
        normalized_sem = sem.strip().upper()
        normalized_slot = slot.strip().upper()

        allocation = (
            db.query(Allocation)
            .join(Exam, Exam.id == Allocation.exam_id)
            .filter(Allocation.slot == normalized_slot)
            .filter(Exam.event_name.ilike(f"%{normalized_sem}%"))
            .order_by(Allocation.id.desc())
            .first()
        )

        if allocation is None:
            raise HTTPException(
                status_code=404,
                detail=f"No allocation found for sem '{normalized_sem}' and slot '{normalized_slot}'",
            )

        exam = db.query(Exam).filter(Exam.id == allocation.exam_id).first()
        if exam is None:
            raise HTTPException(status_code=404, detail="Exam not found for selected allocation")

        extracted_sem = ClassMatrixService._extract_sem(exam.event_name)
        if extracted_sem != normalized_sem:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Allocation found for slot '{normalized_slot}' but exam semester '{extracted_sem}' "
                    f"does not match requested '{normalized_sem}'"
                ),
            )

        rows = (
            db.query(
                Room.id.label("room_id"),
                Room.room_number,
                Room.rows,
                Room.cols,
                SeatAllocation.row,
                SeatAllocation.col,
                Student.reg_no,
                Student.name.label("student_name"),
                Course.code.label("course_code"),
            )
            .join(SeatAllocation, SeatAllocation.room_id == Room.id)
            .join(Student, Student.id == SeatAllocation.student_id)
            .join(Course, Course.id == SeatAllocation.course_id)
            .filter(SeatAllocation.allocation_id == allocation.id)
            .order_by(Room.room_number, SeatAllocation.row, SeatAllocation.col)
            .all()
        )

        if not rows:
            raise HTTPException(status_code=404, detail="No seat allocation rows found")

        exam_payload = {
            "event_name": exam.event_name,
            "date": str(exam.date),
            "sem": normalized_sem,
            "slot": normalized_slot,
        }
        return exam_payload, rows

    @staticmethod
    def _build_room_payloads(exam_payload: dict, rows: list) -> list[dict]:
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
                }

            grouped[room_id]["cells"][(entry.row, entry.col)] = {
                "reg_no": entry.reg_no,
                "student_name": entry.student_name,
                "course_code": entry.course_code,
            }

        room_payloads = []
        for room_group in grouped.values():
            room_payloads.append(
                {
                    "exam": exam_payload,
                    "room": room_group["room"],
                    "cells": room_group["cells"],
                }
            )

        room_payloads.sort(key=lambda item: str(item["room"]["room_number"]))
        return room_payloads

    @staticmethod
    def _build_class_matrix_pdf(room_payload: dict) -> bytes:
        exam = room_payload["exam"]
        room = room_payload["room"]
        cells = room_payload["cells"]

        rows_count = int(room["rows"])
        cols_count = int(room["cols"])

        course_codes_by_col = ["" for _ in range(cols_count)]
        student_grid = [["" for _ in range(cols_count)] for _ in range(rows_count)]
        total_count = 0
        last_filled_row = -1

        for row_idx in range(rows_count):
            for col_idx in range(cols_count):
                seat = cells.get((row_idx, col_idx))
                if seat is None:
                    continue

                if not course_codes_by_col[col_idx]:
                    course_codes_by_col[col_idx] = seat["course_code"] or ""

                student_grid[row_idx][col_idx] = seat["reg_no"] or ""
                total_count += 1
                if row_idx > last_filled_row:
                    last_filled_row = row_idx

        # Hide trailing empty rows after the final allotted student.
        effective_rows = last_filled_row + 1 if last_filled_row >= 0 else 0

        table_data = [["No"] + [ClassMatrixService._col_label(i) for i in range(cols_count)]]
        table_data.append(["1"] + course_codes_by_col)
        for row_idx in range(effective_rows):
            table_data.append([str(row_idx + 1)] + student_grid[row_idx])
        table_data.append([""] + ["" for _ in range(max(cols_count - 2, 0))] + ["TOTAL COUNT:", str(total_count)] if cols_count >= 2 else ["", "TOTAL COUNT:"])

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
        data_col_width = max((available_width - first_col_width) / max(cols_count, 1), 55)
        col_widths = [first_col_width] + [data_col_width for _ in range(cols_count)]

        table = Table(table_data, colWidths=col_widths)

        total_row_index = len(table_data) - 1
        table_style = [
            ("GRID", (0, 0), (-1, -1), 0.8, colors.black),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 1), "Helvetica-Bold"),
            ("BACKGROUND", (0, 1), (-1, 1), colors.lightgrey),
            ("FONTNAME", (0, total_row_index), (-1, total_row_index), "Helvetica-Bold"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]

        if cols_count >= 2:
            table_style.extend(
                [
                    ("SPAN", (1, total_row_index), (max(cols_count - 2, 1), total_row_index)),
                    ("ALIGN", (max(cols_count - 1, 1), total_row_index), (-1, total_row_index), "CENTER"),
                ]
            )

        table.setStyle(TableStyle(table_style))
        story.append(table)

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def get_class_matrix_zip(sem: str, slot: str, db: Session) -> tuple[bytes, str]:
        exam_payload, rows = ClassMatrixService._fetch_room_rows_for_sem_slot(sem=sem, slot=slot, db=db)
        room_payloads = ClassMatrixService._build_room_payloads(exam_payload, rows)

        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
            for room_payload in room_payloads:
                room_number = ClassMatrixService._safe_filename(str(room_payload["room"]["room_number"]))
                pdf_filename = f"class_matrix_{room_number}_{exam_payload['slot']}.pdf"
                pdf_bytes = ClassMatrixService._build_class_matrix_pdf(room_payload)
                zip_file.writestr(pdf_filename, pdf_bytes)

        zip_buffer.seek(0)
        zip_name = (
            f"class_matrix_{ClassMatrixService._safe_filename(exam_payload['sem'])}_"
            f"{ClassMatrixService._safe_filename(exam_payload['slot'])}.zip"
        )
        return zip_buffer.getvalue(), zip_name