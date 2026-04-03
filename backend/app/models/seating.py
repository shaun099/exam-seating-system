from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint # Added UniqueConstraint
from app.db.database import Base

class Seating(Base):
    __tablename__ = "student_exam_entries"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    slot = Column(String(50), nullable=False)
    is_eligible = Column(Boolean, default=True, nullable=False)

    # THIS IS THE KEY FOR SPEED:
    # It prevents duplicate entries and makes the 'existing_seatings' 
    # query in your UploadService run in milliseconds.
    __table_args__ = (
        UniqueConstraint('student_id', 'course_id', 'exam_id', name='_student_course_exam_uc'),
    )