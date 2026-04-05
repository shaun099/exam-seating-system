from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.subject import Subject
from app.models.department import Department
from app.services.exam_service import ExamService

router = APIRouter(
    prefix="/exams",
    tags=["Exams"]
)


class SubjectCreateRequest(BaseModel):
    semester: str
    department: str
    batch: str
    course_name: str
    course_code: str


class SubjectUpdateRequest(BaseModel):
    semester: str
    department: str
    batch: str
    course_name: str
    course_code: str


class DepartmentCreateRequest(BaseModel):
    name: str
    batch: str


def _normalize_batch(batch: str) -> str:
    normalized = (batch or "").strip().lower()
    if normalized == "ktu":
        return "KTU"
    if normalized == "autonomous":
        return "Autonomous"
    raise HTTPException(status_code=400, detail="batch must be either KTU or Autonomous")


@router.get("/subjects", summary="Get subjects")
def get_subjects(
    batch: str | None = Query(default=None),
    semester: str | None = Query(default=None),
    department: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Subject)

    if batch:
        query = query.filter(Subject.batch == _normalize_batch(batch))
    if semester:
        query = query.filter(Subject.semester == semester.strip().upper())
    if department:
        query = query.filter(Subject.department == department.strip())

    subjects = (
        query.order_by(Subject.semester.asc(), Subject.department.asc(), Subject.course_name.asc())
        .all()
    )

    return [
        {
            "id": subject.id,
            "semester": subject.semester,
            "department": subject.department,
            "batch": subject.batch,
            "course_name": subject.course_name,
            "course_code": subject.course_code,
        }
        for subject in subjects
    ]


@router.post("/subjects", summary="Create subject")
def create_subject(payload: SubjectCreateRequest, db: Session = Depends(get_db)):
    normalized_batch = _normalize_batch(payload.batch)
    semester = payload.semester.strip().upper()
    department = payload.department.strip()
    course_name = payload.course_name.strip()
    course_code = payload.course_code.strip().upper()

    if not semester or not department or not course_name or not course_code:
        raise HTTPException(status_code=400, detail="semester, department, course_name, and course_code are required")

    exists = (
        db.query(Subject)
        .filter(
            Subject.semester == semester,
            Subject.department == department,
            Subject.batch == normalized_batch,
            Subject.course_code == course_code,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Subject already exists")

    subject = Subject(
        semester=semester,
        department=department,
        batch=normalized_batch,
        course_name=course_name,
        course_code=course_code,
    )
    db.add(subject)

    department_exists = (
        db.query(Department)
        .filter(Department.batch == normalized_batch, Department.name == department)
        .first()
    )
    if not department_exists:
        db.add(Department(batch=normalized_batch, name=department))

    db.commit()
    db.refresh(subject)

    return {
        "id": subject.id,
        "semester": subject.semester,
        "department": subject.department,
        "batch": subject.batch,
        "course_name": subject.course_name,
        "course_code": subject.course_code,
    }


@router.put("/subjects/{subject_id}", summary="Update subject")
def update_subject(subject_id: int, payload: SubjectUpdateRequest, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    normalized_batch = _normalize_batch(payload.batch)
    semester = payload.semester.strip().upper()
    department = payload.department.strip()
    course_name = payload.course_name.strip()
    course_code = payload.course_code.strip().upper()

    duplicate = (
        db.query(Subject)
        .filter(
            Subject.id != subject_id,
            Subject.semester == semester,
            Subject.department == department,
            Subject.batch == normalized_batch,
            Subject.course_code == course_code,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="Another subject with the same identity already exists")

    subject.semester = semester
    subject.department = department
    subject.batch = normalized_batch
    subject.course_name = course_name
    subject.course_code = course_code

    department_exists = (
        db.query(Department)
        .filter(Department.batch == normalized_batch, Department.name == department)
        .first()
    )
    if not department_exists:
        db.add(Department(batch=normalized_batch, name=department))

    db.commit()
    db.refresh(subject)
    return {
        "id": subject.id,
        "semester": subject.semester,
        "department": subject.department,
        "batch": subject.batch,
        "course_name": subject.course_name,
        "course_code": subject.course_code,
    }


@router.delete("/subjects/{course_code}", summary="Delete subject by course code")
def delete_subject(
    course_code: str,
    batch: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Subject).filter(Subject.course_code == course_code.strip().upper())
    if batch:
        query = query.filter(Subject.batch == _normalize_batch(batch))

    subjects = query.all()
    if not subjects:
        raise HTTPException(status_code=404, detail="Subject not found")

    for subject in subjects:
        db.delete(subject)
    db.commit()

    return {"deleted": len(subjects)}


@router.get("/departments", summary="Get departments")
def get_departments(
    batch: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Department)
    if batch:
        query = query.filter(Department.batch == _normalize_batch(batch))

    departments = query.order_by(Department.name.asc()).all()
    if departments:
        return [
            {"id": department.id, "name": department.name, "batch": department.batch}
            for department in departments
        ]

    fallback_query = db.query(Subject.department, Subject.batch).distinct()
    if batch:
        fallback_query = fallback_query.filter(Subject.batch == _normalize_batch(batch))
    fallback_departments = fallback_query.order_by(Subject.department.asc()).all()
    return [
        {"id": None, "name": name, "batch": dept_batch}
        for name, dept_batch in fallback_departments
    ]


@router.post("/departments", summary="Create department")
def create_department(payload: DepartmentCreateRequest, db: Session = Depends(get_db)):
    normalized_batch = _normalize_batch(payload.batch)
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")

    existing = (
        db.query(Department)
        .filter(Department.batch == normalized_batch, Department.name == name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Department already exists")

    department = Department(name=name, batch=normalized_batch)
    db.add(department)
    db.commit()
    db.refresh(department)

    return {"id": department.id, "name": department.name, "batch": department.batch}


@router.delete("/departments/{department_name}", summary="Delete department")
def delete_department(
    department_name: str,
    batch: str = Query(...),
    db: Session = Depends(get_db),
):
    normalized_batch = _normalize_batch(batch)
    name = department_name.strip()

    department = (
        db.query(Department)
        .filter(Department.batch == normalized_batch, Department.name == name)
        .first()
    )
    if department:
        db.delete(department)

    db.query(Subject).filter(
        Subject.batch == normalized_batch,
        Subject.department == name,
    ).delete(synchronize_session=False)
    db.commit()

    return {"deleted": True}


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