from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.room_schema import RoomCreate
from app.db.database import get_db
from app.services.upload_service import UploadService
from app.models.room import Room   # ✅ IMPORTANT

router = APIRouter(prefix="/upload", tags=["Upload"])


# 📥 Upload Students
@router.post("/students")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return await UploadService.process_upload(file, db)


# 📥 Upload Rooms (CSV)
@router.post("/rooms")
async def upload_rooms(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return await UploadService.process_room_upload(file, db)


# 🗑️ DELETE ROOM
@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    try:
        deleted_data = {
            "id": room.id,
            "roomId": room.roomId if hasattr(room, "roomId") else None,
            "blockName": room.blockName if hasattr(room, "blockName") else None
        }

        db.delete(room)
        db.commit()

        return {
            "message": "Room deleted successfully",
            "deleted_room": deleted_data
        }

    except Exception as e:
        return {"error": str(e)}

# 💾 CREATE ROOM
@router.post("/rooms/create")
def create_room(room_data: RoomCreate, db: Session = Depends(get_db)):

    new_room = Room(
        room_number=room_data.roomId,   # ✅ now valid
        rows=room_data.rows,
        cols=room_data.columns
    )

    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    return {"message": "Room created", "data": new_room}
# ✏️ UPDATE ROOM

@router.put("/rooms/{room_id}")
def update_room(room_id: int, updated_data: dict, db: Session = Depends(get_db)):

    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if "roomId" in updated_data:
        room.room_number = updated_data["roomId"]

    if "rows" in updated_data:
        room.rows = updated_data["rows"]

    if "columns" in updated_data:
        room.cols = updated_data["columns"]

    db.commit()
    db.refresh(room)

    return {"message": "Room updated", "data": room}