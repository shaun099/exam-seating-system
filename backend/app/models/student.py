from sqlalchemy import Column, Integer, String, ForeignKey, Index # Added Index
from app.db.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    # Added index=True here
    reg_no = Column(String(100), unique=True, nullable=False, index=True) 
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)