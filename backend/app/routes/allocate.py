from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.models.allocation import Allocation
from app.models.seat_allocation import SeatAllocation
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
            db.query(Allocation.slot, Allocation.semester, Exam.event_name)
            .join(Exam, Allocation.exam_id == Exam.id)
            .distinct()
            .all()
        )

        seen = set()
        unique = []

        for row in rows:
            key = f"{row.semester}__{row.slot}"
            if key in seen:
                continue
            seen.add(key)
            unique.append({
                "event_name": row.event_name,
                "slot": row.slot,
                "semester": row.semester,
            })

        return {"data": unique}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@seat_allocations_router.get("/slots-summary")
def get_allocated_slots_summary(db: Session = Depends(get_db)):
    return _build_allocated_slots_summary(db)



