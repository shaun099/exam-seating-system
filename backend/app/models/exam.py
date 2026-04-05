from sqlalchemy import Column, Integer, String, Date#type:ignore
from app.db.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    event_name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    session = Column(String(50), nullable=False)