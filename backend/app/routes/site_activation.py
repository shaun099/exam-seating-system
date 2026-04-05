from datetime import date as date_type, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.allocation import Allocation, AllocationExam
from app.models.course import Course
from app.models.exam import Exam
from app.models.room import Room
from app.models.seat_allocation import SeatAllocation
from app.models.site_activation import SiteActivation
from app.models.student import Student
from app.schemas.site_activation import SiteActivationCreate, SiteActivationResponse

router = APIRouter(prefix="/site-activation", tags=["Site Activation"])


def _get_preferred_exam_for_allocation(allocation_id: int, db: Session):
    return (
        db.query(Exam)
        .join(AllocationExam, AllocationExam.exam_id == Exam.id)
        .filter(AllocationExam.allocation_id == allocation_id)
        .order_by(
            # Prefer regular exam title when both regular/supply exist.
            Exam.event_name.contains("(R)").desc(),
            Exam.id.asc(),
        )
        .first()
    )


# ── POST / ────────────────────────────────────────────────────────────────────
@router.post("/", response_model=SiteActivationResponse)
def save_activation_window(payload: SiteActivationCreate, db: Session = Depends(get_db)):
    normalized_sem  = payload.sem.strip().upper()
    normalized_slot = payload.slot.strip().upper()

    allocation = (
        db.query(Allocation)
        .filter(
            Allocation.semester == normalized_sem,
            Allocation.slot     == normalized_slot,
        )
        .first()
    )
    if not allocation:
        raise HTTPException(
            status_code=404,
            detail=f"No allocation found for sem='{normalized_sem}' slot='{normalized_slot}'.",
        )

    exam = _get_preferred_exam_for_allocation(allocation.id, db)
    if not exam:
        raise HTTPException(status_code=404, detail="No exam found for this allocation.")

    session_value = exam.session

    existing = (
        db.query(SiteActivation)
        .filter(
            SiteActivation.sem  == normalized_sem,
            SiteActivation.slot == normalized_slot,
        )
        .first()
    )
    if existing:
        existing.allocation_id = allocation.id
        existing.date          = payload.date
        existing.start_time    = payload.start_time
        existing.end_time      = payload.end_time
        existing.time_gap      = payload.time_gap
        existing.event_name    = payload.event_name
        existing.session       = session_value
        existing.status        = payload.status or "scheduled"
        db.commit()
        db.refresh(existing)
        return existing

    record = SiteActivation(
        allocation_id = allocation.id,
        sem           = normalized_sem,
        slot          = normalized_slot,
        date          = payload.date,
        start_time    = payload.start_time,
        end_time      = payload.end_time,
        time_gap      = payload.time_gap,
        event_name    = payload.event_name,
        session       = session_value,
        status        = payload.status or "scheduled",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── GET / ─────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[SiteActivationResponse])
def list_activation_windows(db: Session = Depends(get_db)):
    return (
        db.query(SiteActivation)
        .order_by(SiteActivation.sem, SiteActivation.slot)
        .all()
    )


# ── GET /slots-summary ────────────────────────────────────────────────────────
@router.get("/slots-summary")
def get_slots_summary(db: Session = Depends(get_db)):
    results = (
        db.query(
            Exam.event_name,
            Allocation.slot,
            Allocation.semester,
            Exam.date,
            Exam.session,
        )
        .join(AllocationExam, AllocationExam.exam_id == Exam.id)
        .join(Allocation, Allocation.id == AllocationExam.allocation_id)
        .join(SeatAllocation, SeatAllocation.allocation_id == Allocation.id)
        .distinct()
        .order_by(Exam.event_name, Allocation.slot)
        .all()
    )
    return {
        "data": [
            {
                "event_name": row.event_name,
                "slot":       row.slot,
                "sem":        row.semester,
                "date":       str(row.date) if row.date else None,
                "session":    row.session,
            }
            for row in results
        ]
    }


# ── GET /student-lookup/{reg_no} — MUST stay above /{sem}/{slot} ─────────────
@router.get("/student-lookup/{reg_no}")
def student_lookup(reg_no: str, db: Session = Depends(get_db)):
    today    = date_type.today()
    now_time = datetime.now().time()

    active_window = (
        db.query(SiteActivation)
        .filter(
            SiteActivation.date       == today,
            SiteActivation.start_time <= now_time,
            SiteActivation.end_time   >= now_time,
        )
        .first()
    )
    if not active_window:
        raise HTTPException(status_code=404, detail="no_active_window")

    student = (
        db.query(Student)
        .filter(Student.reg_no == reg_no.strip().upper())
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="student_not_found")

    seat = (
        db.query(
            SeatAllocation.row,
            SeatAllocation.col,
            Room.room_number,
            Course.code.label("course_code"),
            Course.name.label("course_name"),
            Allocation.slot,
            Allocation.semester,
        )
        .join(Room,       Room.id       == SeatAllocation.room_id)
        .join(Course,     Course.id     == SeatAllocation.course_id)
        .join(Allocation, Allocation.id == SeatAllocation.allocation_id)
        .filter(
            SeatAllocation.student_id    == student.id,
            SeatAllocation.allocation_id == active_window.allocation_id,
        )
        .first()
    )
    if not seat:
        raise HTTPException(status_code=404, detail="no_seat_found")

    exam = _get_preferred_exam_for_allocation(active_window.allocation_id, db)
    if not exam:
        raise HTTPException(status_code=404, detail="no_exam_found")

    col_letter  = chr(ord("A") + seat.col)       # 0→A, 1→B, 2→C …
    seat_number = f"{seat.row + 1}{col_letter}"  # row+1: 0→1, 1→2, etc.
    
    # Convert session to abbreviation: FORENOON->FN, AFTERNOON->AN
    session_abbr = "FN" if exam.session and "FORENOON" in exam.session.upper() else "AN"

    return {
        "reg_no":      student.reg_no,
        "name":        student.name,
        "room_number": seat.room_number,
        "seat_number": seat_number,
        "row_label":   str(seat.row + 1),
        "col_label":   col_letter,
        "course_code": seat.course_code,
        "course_name": seat.course_name,
        "event_name":  exam.event_name,
        "sem":         seat.semester,
        "slot":        seat.slot,
        "session":     session_abbr,
        "start_time":  str(active_window.start_time),
        "end_time":    str(active_window.end_time),
        "date":        str(today),
    }


# ── Parameterised routes LAST ─────────────────────────────────────────────────

@router.get("/{sem}/{slot}", response_model=SiteActivationResponse)
def get_activation_window(sem: str, slot: str, db: Session = Depends(get_db)):
    record = (
        db.query(SiteActivation)
        .filter(
            SiteActivation.sem  == sem.strip().upper(),
            SiteActivation.slot == slot.strip().upper(),
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No activation window found.")
    return record


@router.delete("/{sem}/{slot}")
def delete_activation_window(sem: str, slot: str, db: Session = Depends(get_db)):
    record = (
        db.query(SiteActivation)
        .filter(
            SiteActivation.sem  == sem.strip().upper(),
            SiteActivation.slot == slot.strip().upper(),
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No activation window found.")
    db.delete(record)
    db.commit()
    return {"success": True}