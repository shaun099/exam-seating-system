from sqlalchemy import Column, Integer, String, Boolean, ForeignKey#type:ignore
from app.db.database import Base


class Seating(Base):
    __tablename__ = "student_exam_entries"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    slot = Column(String(50), nullable=False)
    is_eligible = Column(Boolean, default=True, nullable=False)
