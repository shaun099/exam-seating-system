from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class AllocationExam(Base):
    __tablename__ = "allocation_exams"

    id            = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(
        Integer,
        ForeignKey("allocations.id", ondelete="CASCADE"),
        nullable=False,
    )
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("allocation_id", "exam_id", name="allocation_exams_unique"),
    )

    allocation = relationship("Allocation", back_populates="allocation_exams")
    exam       = relationship("Exam")


class Allocation(Base):
    __tablename__ = "allocations"

    id         = Column(Integer, primary_key=True, index=True)
    slot       = Column(String(50), nullable=False)
    semester   = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    allocation_exams = relationship(
        "AllocationExam",
        back_populates="allocation",
        cascade="all, delete-orphan",
    )

    @property
    def exam_ids(self) -> list[int]:
        return [ae.exam_id for ae in self.allocation_exams]