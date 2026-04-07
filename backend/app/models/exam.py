from sqlalchemy import Column, Integer, String, Date, UniqueConstraint
from app.db.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    event_name = Column(String(100), nullable=False)
    date       = Column(Date, nullable=False)
    session    = Column(String(50), nullable=False)

    __table_args__ = (
        UniqueConstraint("event_name", "date", "session", name="uq_exams_event_date_session"),
    )