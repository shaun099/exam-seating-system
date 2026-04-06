from collections import defaultdict
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.allocation import Allocation, AllocationExam
from app.models.course import Course
from app.models.exam import Exam
from app.models.room import Room
from app.models.seat_allocation import SeatAllocation
from app.models.student import Student
from app.schemas.class_matrix import ReplaceRoomPayload
from app.services.class_matrix_service import ClassMatrixService

router = APIRouter(prefix="/download", tags=["Download"])


@router.get("/classMatrix/{sem}/{slot}")
def download_class_matrix(sem: str, slot: str, db: Session = Depends(get_db)):
    try:
        zip_bytes, zip_name = ClassMatrixService.get_class_matrix_zip(sem=sem, slot=slot, db=db)
        return StreamingResponse(
            BytesIO(zip_bytes),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={zip_name}",
                "X-Success": "true",
                "X-Message": "Class matrix downloaded successfully.",
            },
        )
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": str(exc.detail)},
        )
    except Exception as exc:  # pragma: no cover
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to download class matrix: {exc}"},
        )


@router.get("/classMatrix/preview/{sem}/{slot}")
def preview_class_matrix(sem: str, slot: str, db: Session = Depends(get_db)):
    base_exam_payload, rows, allocation_event_map = ClassMatrixService._fetch_room_rows_for_sem_slot(
        sem=sem,
        slot=slot,
        db=db,
    )
    room_payloads = ClassMatrixService._build_room_payloads(
        base_exam_payload,
        rows,
        allocation_event_map,
    )
    return ClassMatrixService.build_preview_response(room_payloads, base_exam_payload)


@router.post("/classMatrix/replace-room")
def replace_room(payload: ReplaceRoomPayload, db: Session = Depends(get_db)):
    ClassMatrixService.replace_room(payload, db)
    return {"success": True}


def _get_allocation_and_exam(sem: str, slot: str, db: Session):
    allocation = (
        db.query(Allocation)
        .filter(Allocation.semester == sem, Allocation.slot == slot)
        .first()
    )
    if not allocation:
        raise HTTPException(
            status_code=404,
            detail=f"No allocation found for semester '{sem}' and slot '{slot}'",
        )

    exam = (
        db.query(Exam)
        .join(AllocationExam, AllocationExam.exam_id == Exam.id)
        .filter(AllocationExam.allocation_id == allocation.id)
        .order_by(
            # Prefer regular exam title when both regular/supply exist.
            Exam.event_name.contains("(R)").desc(),
            Exam.id.asc(),
        )
        .first()
    )
    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found for the selected allocation",
        )

    return allocation, exam


def _get_seat_allocations(allocation_id: int, db: Session):
    return (
        db.query(
            SeatAllocation,
            Room.room_number,
            Course.code,
            Course.name,
            Student.reg_no,
        )
        .join(Room, SeatAllocation.room_id == Room.id)
        .join(Course, SeatAllocation.course_id == Course.id)
        .join(Student, SeatAllocation.student_id == Student.id)
        .filter(SeatAllocation.allocation_id == allocation_id)
        .order_by(Room.room_number, Course.code, Student.reg_no)
        .all()
    )


def _build_room_map(allocations):
    room_map = defaultdict(lambda: defaultdict(list))
    for _, room_number, course_code, course_name, reg_no in allocations:
        room_key = str(room_number)
        room_map[room_key][course_code].append((reg_no, course_name))
    return room_map


@router.get("/attendencesheet/{sem}/{slot}")
def download_attendance_sheet(sem: str, slot: str, db: Session = Depends(get_db)):
    allocation, exam = _get_allocation_and_exam(sem, slot, db)
    allocations = _get_seat_allocations(allocation.id, db)

    if not allocations:
        raise HTTPException(status_code=404, detail="No seating data found")

    room_map = _build_room_map(allocations)

    rooms = []
    sl_no = 1
    for room_no, course_dict in room_map.items():
        course_rows = []
        total = 0
        for course_code, entries in course_dict.items():
            reg_nos = sorted([entry[0] for entry in entries])
            course_name = entries[0][1] if entries else ""
            course_rows.append(
                {
                    "subject": course_code,
                    "course_name": course_name,
                    "range": f"{reg_nos[0]} - {reg_nos[-1]}" if reg_nos else "",
                    "count": len(reg_nos),
                }
            )
            total += len(reg_nos)

        rooms.append(
            {
                "sl_no": sl_no,
                "room": room_no,
                "rows": course_rows,
                "total": total,
            }
        )
        sl_no += 1

    return {"date": str(exam.date), "session": exam.session, "rooms": rooms}


@router.get("/attendencesheet-pdf/{sem}/{slot}")
def download_attendance_sheet_pdf(sem: str, slot: str, db: Session = Depends(get_db)):
    allocation, exam = _get_allocation_and_exam(sem, slot, db)
    allocations = _get_seat_allocations(allocation.id, db)

    if not allocations:
        raise HTTPException(status_code=404, detail="No seating data found")

    room_map = _build_room_map(allocations)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    bold_center = ParagraphStyle(
        "bold_center",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=9,
    )
    normal_center = ParagraphStyle(
        "normal_center",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=8,
    )
    small_bold = ParagraphStyle(
        "small_bold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        alignment=TA_CENTER,
    )
    cell_style = ParagraphStyle(
        "cell",
        parent=styles["Normal"],
        fontSize=7,
        alignment=TA_CENTER,
        leading=9,
    )

    elements = [
        Paragraph("ST. JOSEPH'S COLLEGE OF ENGINEERING AND TECHNOLOGY, PALAI", bold_center),
        Paragraph(exam.event_name, normal_center),
        Paragraph("CONSOLIDATED ABSENTEES REGISTER", bold_center),
        Spacer(1, 3 * mm),
    ]

    info_data = [["DATE", "", f"{exam.date}  {exam.session}", "SLOT", slot]]
    info_table = Table(info_data, colWidths=[15 * mm, 5 * mm, 120 * mm, 15 * mm, 20 * mm])
    info_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    elements.extend([info_table, Spacer(1, 3 * mm)])

    header_row = [
        Paragraph("SL NO.", small_bold),
        Paragraph("HALL /<br/>ROOM", small_bold),
        Paragraph("REGISTER NO.", small_bold),
        Paragraph("TOTAL", small_bold),
        Paragraph("SUBJECT AND CODE", small_bold),
        Paragraph("REGISTER NO. OF<br/>ABSENTEES", small_bold),
        Paragraph("NO. OF<br/>ABSENTEES", small_bold),
        Paragraph("REGISTER NUMBERS<br/>OF SPARE CODE USED", small_bold),
        Paragraph("NAME AND SIGNATURE<br/>OF INVIGILATOR", small_bold),
    ]

    col_widths = [12 * mm, 18 * mm, 48 * mm, 13 * mm, 48 * mm, 45 * mm, 17 * mm, 33 * mm, 33 * mm]
    row_height = 28 * mm

    table_data = [header_row]
    span_commands = []
    row_heights = [10 * mm]

    sl_no = 1
    data_row_idx = 1

    for room_no, course_dict in room_map.items():
        courses = list(course_dict.items())
        room_total = sum(len(entries) for entries in course_dict.values())
        n_rows = len(courses)

        for i, (course_code, entries) in enumerate(courses):
            reg_nos = sorted([entry[0] for entry in entries])
            course_name = entries[0][1] if entries else ""
            reg_range = f"{course_code}: {reg_nos[0]} - {reg_nos[-1]}" if reg_nos else ""
            subject_label = f"{course_name} ({course_code})"

            if i == 0:
                row = [
                    Paragraph(str(sl_no), cell_style),
                    Paragraph(room_no, cell_style),
                    Paragraph(reg_range, cell_style),
                    Paragraph(str(room_total), cell_style),
                    Paragraph(subject_label, cell_style),
                    "",
                    "",
                    "",
                    "",
                ]
                if n_rows > 1:
                    span_commands.append(("SPAN", (0, data_row_idx), (0, data_row_idx + n_rows - 1)))
                    span_commands.append(("SPAN", (1, data_row_idx), (1, data_row_idx + n_rows - 1)))
                    span_commands.append(("SPAN", (3, data_row_idx), (3, data_row_idx + n_rows - 1)))
            else:
                row = [
                    "",
                    "",
                    Paragraph(reg_range, cell_style),
                    "",
                    Paragraph(subject_label, cell_style),
                    "",
                    "",
                    "",
                    "",
                ]

            table_data.append(row)
            row_heights.append(row_height)
            data_row_idx += 1

        sl_no += 1

    table = Table(table_data, colWidths=col_widths, rowHeights=row_heights)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (2, 1), (2, -1), 3),
        ("LEFTPADDING", (4, 1), (4, -1), 3),
        ("ALIGN", (2, 1), (2, -1), "CENTER"),
        ("ALIGN", (4, 1), (4, -1), "CENTER"),
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
    ] + span_commands

    table.setStyle(TableStyle(style_cmds))
    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Attendance_{sem}_Slot{slot}.pdf"},
    )


@router.get("/seating/{sem}/{slot}")
def download_seating(sem: str, slot: str, db: Session = Depends(get_db)):
    allocation, exam = _get_allocation_and_exam(sem, slot, db)
    allocations = _get_seat_allocations(allocation.id, db)

    if not allocations:
        raise HTTPException(status_code=404, detail="No seating data found")

    room_map = _build_room_map(allocations)

    final_rooms = []
    sl_no = 1
    for room_no, course_dict in room_map.items():
        course_rows = []
        total = 0
        for course_code, entries in course_dict.items():
            reg_nos = sorted([entry[0] for entry in entries])
            course_rows.append(
                {
                    "subject": course_code,
                    "range": f"{reg_nos[0]} - {reg_nos[-1]}" if reg_nos else "",
                    "count": len(reg_nos),
                }
            )
            total += len(reg_nos)

        final_rooms.append(
            {
                "sl_no": sl_no,
                "room": room_no,
                "rows": course_rows,
                "total": total,
            }
        )
        sl_no += 1

    return {"date": str(exam.date), "session": exam.session, "rooms": final_rooms}


@router.get("/seating-pdf/{sem}/{slot}")
def download_seating_pdf(sem: str, slot: str, db: Session = Depends(get_db)):
    allocation, exam = _get_allocation_and_exam(sem, slot, db)
    allocations = _get_seat_allocations(allocation.id, db)

    if not allocations:
        raise HTTPException(status_code=404, detail="No seating data found")

    room_map = _build_room_map(allocations)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    center_style = ParagraphStyle(
        "center",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=9,
        spaceAfter=2,
    )
    title_style = ParagraphStyle(
        "title",
        parent=styles["Title"],
        fontSize=11,
        spaceAfter=2,
    )

    elements = [
        Paragraph("ST. JOSEPH'S COLLEGE OF ENGINEERING AND TECHNOLOGY, PALAI", title_style),
        Paragraph(exam.event_name, center_style),
        Paragraph("<b>CONSOLIDATED SEATING ARRANGEMENT</b>", center_style),
        Paragraph(str(exam.date), center_style),
        Spacer(1, 5 * mm),
    ]

    table_data = [["Sl\nNo", "Hall /\nRoom No.", "Register Numbers", "Count", "Total"]]
    sl_no = 1

    for room_no, course_dict in room_map.items():
        courses = list(course_dict.items())
        room_total = sum(len(entries) for entries in course_dict.values())
        for i, (course_code, entries) in enumerate(courses):
            reg_nos = sorted([entry[0] for entry in entries])
            reg_range = f"{course_code}: {reg_nos[0]} - {reg_nos[-1]}" if reg_nos else ""
            if i == 0:
                table_data.append([sl_no, room_no, reg_range, len(reg_nos), room_total])
            else:
                table_data.append(["", "", reg_range, len(reg_nos), ""])
        sl_no += 1

    col_widths = [12 * mm, 25 * mm, 108 * mm, 18 * mm, 17 * mm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d3748")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("ALIGN", (2, 1), (2, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafc")]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (2, 1), (2, -1), 4),
            ]
        )
    )

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Seating_{sem}_Slot{slot}.pdf"},
    )
