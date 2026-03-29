from sqlalchemy import Column, String, Boolean, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(Text, unique=True, nullable=False)
    full_name = Column(Text)
    role = Column(Text, default="staff")
    is_approved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())