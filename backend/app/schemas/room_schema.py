from pydantic import BaseModel

class RoomCreate(BaseModel):
    roomId: str
    rows: int
    columns: int
   