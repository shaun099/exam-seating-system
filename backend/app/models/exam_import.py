import uuid
from sqlalchemy import Column, String, Text, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from app.db.database import Base


class ExamImport(Base):
    __tablename__ = "exam_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_name = Column(Text, nullable=False)
    file_url = Column(Text, nullable=True)
    batch = Column(Text, nullable=False)
    semester = Column(Text, nullable=False)
    department = Column(Text, nullable=False)
    course_code = Column(Text, nullable=False)
    division = Column(Text, nullable=True, default="NA")
    student_count = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=True)