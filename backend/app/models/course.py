from sqlalchemy import Column, Integer, String, ForeignKey#type:ignore
from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    code = Column(String(100),unique=True,nullable=False)
    name = Column(String(100), nullable=False)
    
