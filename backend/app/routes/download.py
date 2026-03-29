from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.class_matrix_service import ClassMatrixService

router = APIRouter(prefix="/download", tags=["Download"])


@router.get("/classMatrix/{sem}/{slot}")
def download_class_matrix(sem: str, slot: str, db: Session = Depends(get_db)):
    zip_bytes, zip_name = ClassMatrixService.get_class_matrix_zip(sem=sem, slot=slot, db=db)
    return StreamingResponse(
        BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={zip_name}"},
    )


@router.get("/attendencesheet/{sem}/{slot}")
def download_attendance_sheet(sem: str, slot: str, db: Session = Depends(get_db)):
    pass


@router.get("/seating/{sem}/{slot}")
def download_seating(sem: str, slot: str, db: Session = Depends(get_db)):
    pass