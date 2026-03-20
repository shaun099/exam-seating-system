from sqlalchemy import Column, Integer, String, ForeignKey#type:ignore
from app.db.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    reg_no = Column(String(100), unique=True, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
