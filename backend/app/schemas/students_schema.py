from pydantic import BaseModel
from typing import Optional

class StudentBase(BaseModel):
    name: str 
    reg_no: str 
    branch_id: int 

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int 

    class Config:
        from_attributes = True