from pydantic import BaseModel


class ReplaceRoomPayload(BaseModel):
    sem: str
    slot: str
    old_room_id: int
    new_room_number: str