from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.upload_service import UploadService

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/students")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return await UploadService.process_upload(file, db)