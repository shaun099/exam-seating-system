from sqlalchemy import Column, BigInteger, Text
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from app.db.database import Base


class Course(Base):
    """
    Maps to the 'courses' table.
    seat_allocations.course_id and student_exam_entries.course_id both FK here.
    Do NOT rename this tablename — it will break both FK chains.
    """
    __tablename__ = "courses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=True)

    semester = Column(Text, nullable=False)
    department = Column(Text, nullable=False)
    batch = Column(Text, nullable=False)
    course_name = Column(Text, nullable=False)
    course_code = Column(Text, nullable=False)