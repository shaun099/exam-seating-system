import re
from collections import defaultdict

from sqlalchemy.orm import Session
from sqlalchemy import tuple_

from app.models.exam import Exam
from app.models.seating import Seating


class ExamService:

    @staticmethod
    def extract_semester(event_name: str) -> str | None:
        """
        Extract semester from event_name.
        Example: "B.Tech S4 (S) Exam April 2025 (2019 Scheme)" → "S4"
        Returns None if no match found.
        """
        match = re.search(r'(S\d+)', event_name)
        return match.group(1) if match else None

    @staticmethod
    def _format_exam(exam: Exam, slot_list: list) -> dict:
        """
        Serialize a single exam object into response dict.
        """
        return {
            "exam_id": exam.id,
            "event_name": exam.event_name,
            "semester": ExamService.extract_semester(exam.event_name),
            "date": exam.date.isoformat() if exam.date else None,
            "session": exam.session,
            "available_slots": slot_list,
        }

    @staticmethod
    def get_all_exams(db: Session) -> list[dict]:
        """
        Fetch all exams with their available slots.
        Uses a single batched query for slots instead of N+1 queries.
        """
        exams = db.query(Exam).all()
        if not exams:
            return []

        exam_ids = [exam.id for exam in exams]

        # Single query for all slots across all exams
        rows = (
            db.query(Seating.exam_id, Seating.slot)
            .filter(Seating.exam_id.in_(exam_ids))
            .distinct()
            .all()
        )

        # Group slots by exam_id in memory
        slots_map: dict[int, list[str]] = defaultdict(list)
        for exam_id, slot in rows:
            slots_map[exam_id].append(slot)

        return [
            ExamService._format_exam(exam, slots_map.get(exam.id, []))
            for exam in exams
        ]

    @staticmethod
    def get_exam_by_id(exam_id: int, db: Session) -> dict | None:
        """
        Fetch a specific exam with its slot information.
        """
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