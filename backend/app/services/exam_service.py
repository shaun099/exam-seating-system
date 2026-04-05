import re
from collections import defaultdict

from sqlalchemy.orm import Session

# Single consolidated import — fixes the duplicate-import bug that left Seating out of scope
from app.models.exam import Exam
from app.models.seating import Seating
from app.models.exam_import import ExamImport
from app.models.subject import Subject


class ExamService:

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    @staticmethod
    def extract_semester(event_name: str) -> str | None:
        """
        Extract semester label from an event name.
        Example: "B.Tech S4 (S) Exam April 2025 (2019 Scheme)" → "S4"
        """
        match = re.search(r"(S\d+)", event_name)
        return match.group(1) if match else None

    @staticmethod
    def _format_exam(exam: Exam, slot_list: list) -> dict:
        return {
            "exam_id": exam.id,
            "event_name": exam.event_name,
            "semester": ExamService.extract_semester(exam.event_name),
            "date": exam.date.isoformat() if exam.date else None,
            "session": exam.session,
            "available_slots": slot_list,
        }

    # ------------------------------------------------------------------ #
    #  Exam queries                                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_all_exams(db: Session) -> list[dict]:
        """
        Fetch all exams with their available slots.
        Uses a single batched query for slots (no N+1).
        """
        exams = db.query(Exam).all()
        if not exams:
            return []

        exam_ids = [exam.id for exam in exams]

        rows = (
            db.query(Seating.exam_id, Seating.slot)
            .filter(Seating.exam_id.in_(exam_ids))
            .distinct()
            .all()
        )

        slots_map: dict[int, list[str]] = defaultdict(list)
        for exam_id, slot in rows:
            slots_map[exam_id].append(slot)

        return [
            ExamService._format_exam(exam, slots_map.get(exam.id, []))
            for exam in exams
        ]

    @staticmethod
    def get_exam_by_id(exam_id: int, db: Session) -> dict | None:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            return None

        slots = (
            db.query(Seating.slot)
            .filter(Seating.exam_id == exam_id)
            .distinct()
            .all()
        )

        return ExamService._format_exam(exam, [slot for (slot,) in slots])

    # ------------------------------------------------------------------ #
    #  Subject (Course) management                                         #
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_all_subjects(db: Session) -> list[Subject]:
        return db.query(Subject).order_by(Subject.semester, Subject.department, Subject.course_name).all()

    @staticmethod
    def add_subject(db: Session, data: dict) -> Subject:
        """
        Inserts a new row into the 'subjects' table.
        Raises ValueError on duplicate key or constraint violation.
        """
        subject = Subject(**data)
        db.add(subject)
        try:
            db.commit()
            db.refresh(subject)
        except Exception as exc:
            db.rollback()
            raise ValueError(f"Could not add subject: {exc}") from exc
        return subject

    @staticmethod
    def delete_subject(db: Session, course_code: str) -> bool:
        """
        Deletes a subject from the 'subjects' table by course_code.
        Returns False if nothing was deleted (triggers 404 in the router).
        """
        deleted = db.query(Subject).filter(Subject.course_code == course_code).delete()
        if not deleted:
            db.rollback()
            return False
        db.commit()
        return True

    # ------------------------------------------------------------------ #
    #  Exam import tags                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def save_exam_import(db: Session, import_data: dict) -> ExamImport:
        """
        Saves tagged metadata for an uploaded exam file.

        Accepted keys (must match exam_imports columns exactly):
            id, file_name, file_url, batch, semester,
            department, course_code, division, student_count
        """
        allowed_columns = {col.name for col in ExamImport.__table__.columns}
        filtered = {k: v for k, v in import_data.items() if k in allowed_columns}

        db_import = ExamImport(**filtered)
        db.add(db_import)
        try:
            db.commit()
            db.refresh(db_import)
        except Exception as exc:
            db.rollback()
            raise ValueError(f"Could not save import tags: {exc}") from exc
        return db_import