from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.exam_service import ExamService

router = APIRouter(
    prefix="/exams",
    tags=["Exams"]
)


@router.get("/", summary="Get all exams with available slots")
def get_all_exams(db: Session = Depends(get_db)):
    """
    Returns all exams with their event names, semesters, and available slots.
    """
    try:
        exams = ExamService.get_all_exams(db)
        return {
            "success": True,
            "message": "Exams fetched successfully.",
            "data": exams,
            "count": len(exams)
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error fetching exams: {str(e)}"},
        )


@router.get("/{exam_id}", summary="Get specific exam with slots")
def get_exam_by_id(exam_id: int, db: Session = Depends(get_db)):
    """
    Returns a specific exam with its available slots.
    """
    try:
        exam = ExamService.get_exam_by_id(exam_id, db)
        if not exam:
            raise HTTPException(
                status_code=404,
                detail=f"Exam with id {exam_id} not found"
            )
        return {
            "success": True,
            "message": "Exam fetched successfully.",
            "data": exam
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error fetching exam: {str(e)}"},
        )
