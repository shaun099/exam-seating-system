from pydantic import BaseModel
from typing import List, Optional

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class BulkUserItem(BaseModel):
    name: str
    email: str

class BulkCreateRequest(BaseModel):
    users: List[BulkUserItem]
    default_password: str = "adminpass"