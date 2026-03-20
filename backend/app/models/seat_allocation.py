from sqlalchemy import Column, Integer, ForeignKey
from app.db.database import Base


class SeatAllocation(Base):
    __tablename__ = "seat_allocations"

    id = Column(Integer, primary_key=True, index=True)

    allocation_id = Column(Integer, ForeignKey("allocations.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)