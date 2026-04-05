from sqlalchemy import Column, BigInteger, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from app.db.database import Base


class Subject(Base):
    """
    Maps to the 'subjects' table — used by the exam import feature.
    Entirely separate from Course/courses which seat_allocations FKs into.
    """
    __tablename__ = "subjects"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=True)

    semester = Column(Text, nullable=False)
    department = Column(Text, nullable=False)
    batch = Column(Text, nullable=False)
    course_name = Column(Text, nullable=False)
    course_code = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint("semester", "department", "batch", "course_code", name="unique_subject_entry"),
        CheckConstraint("batch = ANY(ARRAY['KTU', 'Autonomous'])", name="valid_batch"),
        CheckConstraint(r"semester ~ '^S[1-8]$'", name="valid_semester"),
    )