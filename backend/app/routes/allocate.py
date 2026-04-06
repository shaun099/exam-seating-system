from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.models.allocation import Allocation, AllocationExam
from app.db.database import get_db
from app.models.exam import Exam
from app.services.allocation_service import AllocationService
from app.schemas.entry_schema import AllocationRequest

router = APIRouter(prefix="/allocate", tags=["Allocation"])
seat_allocations_router = APIRouter(prefix="/seat-allocations", tags=["Seat Allocations"])


@router.post("/")
def allocate_students(
    data: AllocationRequest,
    db: Session = Depends(get_db)
):
    try:
        result = AllocationService.allocate(data.slot,data.sem, data.rows, data.cols, db)

        if not isinstance(result, dict):
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Invalid allocation response from service.",
                },
            )

        if "success" not in result:
            result["success"] = True
        if "message" not in result:
            result["message"] = "Allocation completed successfully."

        return JSONResponse(status_code=200, content=result)

    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": str(exc.detail),
            },
        )
    except Exception as e:
        print(f"ALLOCATION ERROR: {e}") 
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Unexpected error while allocating students.",
            },
        )
def _build_allocated_slots_summary(db: Session):
    try:
        rows = (
            db.query(Allocation.slot, Allocation.semester, Exam.event_name, Exam.date)
            .join(AllocationExam, AllocationExam.allocation_id == Allocation.id)
            .join(Exam, Exam.id == AllocationExam.exam_id)
            .order_by(
                Allocation.semester.asc(),
                Allocation.slot.asc(),
                Exam.date.asc(),
                Exam.id.asc(),
            )
            .all()
        )

        grouped = {}
        for row in rows:
            key = (row.semester, row.slot)
            if key not in grouped:
                grouped[key] = {
                    "slot": row.slot,
                    "semester": row.semester,
                    "date": row.date,
                    "event_names": [],
                    "_seen_event_names": set(),
                }

            if row.event_name not in grouped[key]["_seen_event_names"]:
                grouped[key]["_seen_event_names"].add(row.event_name)
                grouped[key]["event_names"].append(row.event_name)

        unique = []
        for item in grouped.values():
            ordered_names = sorted(
                item["event_names"],
                key=lambda name: ("(R)" not in name, name),
            )
            primary_name = ordered_names[0] if ordered_names else ""
            unique.append({
                "event_name": primary_name,
                "event_names": ordered_names,
                "slot": item["slot"],
                "semester": item["semester"],
                "date": str(item["date"]) if item["date"] else None,
            })

        unique.sort(key=lambda r: (r["semester"], r["slot"]))

        return {"data": unique}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@seat_allocations_router.get("/slots-summary/")
def get_allocated_slots_summary(db: Session = Depends(get_db)):
    return _build_allocated_slots_summary(db)
