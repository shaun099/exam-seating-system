from pydantic import BaseModel
from datetime import date
class ExamBase(BaseModel):
    event_name: str 
    date: date
    session: str  # "FORENOON" or "AFTERNOON"

class ExamCreate(ExamBase):
    pass

class Exam(ExamBase):
    id: int

    class Config:
        from_attributes = True