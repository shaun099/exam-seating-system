from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class ExamEntryBase(BaseModel):
    student_id: int 
    course_id: int 
    exam_id: int
    slot: str 
    is_eligible: bool = True 

class ExamEntryCreate(ExamEntryBase):
    pass

# Detailed schema for GET /exam-entries response
class ExamEntryRead(BaseModel):
    id: int 
    student_name: str 
    student_reg_no: str 
    branch_name: str
    course_name: str 
    course_code: str 
    event_name: str 
    exam_date: date 
    session: str 
    slot: str 
    is_eligible: bool

    class Config:
        from_attributes = True

# Schema for the 6x5 seating matrix
class SeatingMatrix(BaseModel):
    slot: str 
    matrix: List[List[Optional[dict]]] 
    # Represents 6 rows x 5 columns



class AllocationRequest(BaseModel):
    exam_id:int
    slot: str
    sem: str
    rows: int
    cols: int