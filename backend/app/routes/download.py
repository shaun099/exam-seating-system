from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db

router = APIRouter(prefix="/download", tags=["Download"])


@router.get("/classMatrix")
def download_class_matrix(db: Session = Depends(get_db)):
    pass


@router.get("/attendencesheet")
def download_attendance_sheet(db: Session = Depends(get_db)):
    pass


@router.get("/seating")
def download_seating(db: Session = Depends(get_db)):
    pass
