from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.allocation_service import AllocationService
from app.schemas.entry_schema import AllocationRequest

router = APIRouter(prefix="/allocate", tags=["Allocation"])


@router.post("/")
def allocate_students(
    data: AllocationRequest,
    db: Session = Depends(get_db)
):
    return AllocationService.allocate(data.slot, data.rows, data.cols, db)