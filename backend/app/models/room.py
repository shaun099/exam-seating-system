from sqlalchemy import Column, Integer, String, Date#type:ignore
from app.db.database import Base

class Room(Base):
    __tablename__ = "room1"

    id = Column(Integer, primary_key = True, unique = True, autoincrement= True)
    room_id = Column(String(50), nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)