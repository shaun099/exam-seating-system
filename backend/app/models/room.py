from sqlalchemy import Column, Integer, String
from app.db.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)