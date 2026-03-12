from sqlalchemy import Column, Integer, String#type:ignore
from app.db.database import Base


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, unique=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
