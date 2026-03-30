from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.exam import Exam
from app.models.seating import Seating


class ExamService:

    @staticmethod
    def extract_semester(event_name: str) -> str:
        """
        Extract semester from event_name.
        Example: "B.Tech S4 (S) Exam April 2025 (2019 Scheme)" → "S4"
        """
        import re
        match = re.search(r'(S\d+)', event_name)
        return match.group(1) if match else event_name

    @staticmethod
    def get_all_exams(db: Session):
        """
        Fetch all exams with their available slots.
        Returns list of exams with slots information.
        """
        exams = db.query(Exam).all()

        result = []
        for exam in exams:
            # Get distinct slots for this exam
            slots = (
                db.query(Seating.slot)
                .filter(Seating.exam_id == exam.id)
                .distinct()
                .all()
            )

            slot_list = [slot[0] for slot in slots]

            # Extract semester from event_name
            semester = ExamService.extract_semester(exam.event_name)

            result.append({
                "exam_id": exam.id,
                "event_name": exam.event_name,
                "semester": semester,
                "date": exam.date.isoformat() if exam.date else None,
                "session": exam.session,
                "available_slots": slot_list
            })

        return result

    @staticmethod
    def get_exam_by_id(exam_id: int, db: Session):
        """
        Fetch a specific exam with its slot information.
        """
        exam = db.query(Exam).filter(Exam.id == exam_id).first()

        if not exam:
            return None

        # Get distinct slots for this exam
        slots = (
            db.query(Seating.slot)
            .filter(Seating.exam_id == exam.id)
            .distinct()
            .all()
        )

        slot_list = [slot[0] for slot in slots]

        # Extract semester from event_name
        semester = ExamService.extract_semester(exam.event_name)

        return {
            "exam_id": exam.id,
            "event_name": exam.event_name,
            "semester": semester,
            "date": exam.date.isoformat() if exam.date else None,
            "session": exam.session,
            "available_slots": slot_list
        }
