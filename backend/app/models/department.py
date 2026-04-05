from sqlalchemy import Column, BigInteger, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from app.db.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=True)

    name = Column(Text, nullable=False)
    batch = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint("name", "batch", name="unique_department_entry"),
        CheckConstraint("batch = ANY(ARRAY['KTU', 'Autonomous'])", name="valid_department_batch"),
    )
