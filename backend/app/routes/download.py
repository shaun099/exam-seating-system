from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.class_matrix_service import ClassMatrixService
from app.schemas.class_matrix import ReplaceRoomPayload

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

@router.get("/classMatrix/preview/{sem}/{slot}")
def preview_class_matrix(sem: str, slot: str, db: Session = Depends(get_db)):
    base_exam_payload, rows, allocation_event_map = (
        ClassMatrixService._fetch_room_rows_for_sem_slot(sem=sem, slot=slot, db=db)
    )
    room_payloads = ClassMatrixService._build_room_payloads(
        base_exam_payload, rows, allocation_event_map
    )
    return ClassMatrixService.build_preview_response(room_payloads, base_exam_payload)

@router.post("/classMatrix/replace-room")
def replace_room(payload: ReplaceRoomPayload, db: Session = Depends(get_db)):
    ClassMatrixService.replace_room(payload, db)
    return {"success": True}

@router.get("/attendencesheet/{sem}/{slot}")
def download_attendance_sheet(sem: str, slot: str, db: Session = Depends(get_db)):
    try:
        # Implementation using existing Service patterns
        pdf_bytes, filename = ClassMatrixService.get_attendance_sheet_pdf(sem=sem, slot=slot, db=db)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Success": "true"
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to generate attendance sheet: {str(e)}"},
        )

@router.get("/seating/{sem}/{slot}")
def download_seating(sem: str, slot: str, db: Session = Depends(get_db)):
    try:
        # Implementation using existing Service patterns
        xlsx_bytes, filename = ClassMatrixService.get_consolidated_seating_xlsx(sem=sem, slot=slot, db=db)
        return StreamingResponse(
            BytesIO(xlsx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Success": "true"
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to generate seating plan: {str(e)}"},
        )