from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.services.exam_service import ExamService

router = APIRouter(prefix="/exams", tags=["Exams"])


# ------------------------------------------------------------------ #
#  Pydantic schemas                                                    #
# ------------------------------------------------------------------ #

class CourseOut(BaseModel):
    id: int
    semester: str
    department: str
    batch: str
    course_name: str
    course_code: str

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    semester: str
    department: str
    batch: str
    course_name: str
    course_code: str


class ExamImportCreate(BaseModel):
    id: Optional[str] = None
    file_name: str
    file_url: Optional[str] = None
    batch: str
    semester: str
    department: str
    course_code: str
    division: str = "NA"
    student_count: Optional[int] = None


class ExamImportOut(BaseModel):
    id: uuid.UUID
    file_name: str
    batch: str
    semester: str
    department: str
    course_code: str
    division: str
    student_count: Optional[int]

    class Config:
        from_attributes = True


# ------------------------------------------------------------------ #
#  Subject endpoints  ← MUST be before /{exam_id} to avoid shadowing  #
# ------------------------------------------------------------------ #

@router.get("/subjects", response_model=List[CourseOut], summary="Fetch all subjects")
def get_subjects(db: Session = Depends(get_db)):
    try:
        return ExamService.get_all_subjects(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subjects", response_model=CourseOut, summary="Add a new subject")
def add_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    try:
        return ExamService.add_subject(db, subject.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/subjects/{course_code}", summary="Delete a subject by course_code")
def delete_subject(course_code: str, db: Session = Depends(get_db)):
    deleted = ExamService.delete_subject(db, course_code)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Subject '{course_code}' not found")
    return {"success": True, "message": "Subject deleted"}


@router.post("/import-tags", response_model=ExamImportOut, summary="Save tagged metadata for exam files")
def save_exam_tags(payload: ExamImportCreate, db: Session = Depends(get_db)):
    try:
        saved = ExamService.save_exam_import(db, payload.model_dump(exclude_none=True))
        return saved
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------------------------------------------------------ #
#  Exam endpoints  ← /{exam_id} LAST so it can't shadow static routes #
# ------------------------------------------------------------------ #

@router.get("/", summary="Get all exams with available slots")
def get_all_exams(db: Session = Depends(get_db)):
    try:
        exams = ExamService.get_all_exams(db)
        return {"success": True, "data": exams, "count": len(exams)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


@router.get("/{exam_id}", summary="Get a specific exam")
def get_exam_by_id(exam_id: int, db: Session = Depends(get_db)):
    exam = ExamService.get_exam_by_id(exam_id, db)
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")
    return {"success": True, "data": exam}