from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
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
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to download class matrix: {str(e)}"},
        )


@router.get("/attendencesheet/{sem}/{slot}")
def download_attendance_sheet(sem: str, slot: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Attendance sheet download is not implemented yet.")


@router.get("/seating/{sem}/{slot}")
def download_seating(sem: str, slot: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Seating download is not implemented yet.")