from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.schemas.room_schema import RoomCreate
from app.db.database import get_db
from app.services.upload_service import UploadService
from app.models.room import Room   # ✅ IMPORTANT

router = APIRouter(prefix="/upload", tags=["Upload"])

# 📥 GET ALL ROOMS
@router.get("/rooms")
def get_rooms(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()

    return [
        {
            "id": room.id,
            "room_number": room.room_number,
            "rows": room.rows,
            "cols": room.cols
        }
        for room in rooms
    ]


# 📥 Upload Students
@router.post("/students")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        result = await UploadService.process_upload(file, db)
        return {
            "success": True,
            "message": "Students uploaded successfully.",
            "data": result,
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Student upload failed: {str(e)}"},
        )


# 📥 Upload Rooms (CSV)
@router.post("/rooms")
async def upload_rooms(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        result = await UploadService.process_room_upload(file, db)
        return {
            "success": True,
            "message": "Rooms uploaded successfully.",
            "data": result,
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Room upload failed: {str(e)}"},
        )


# 🗑️ DELETE ROOM
@router.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    print("DELETE ID RECEIVED:", room_id)

    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    db.delete(room)
    db.commit()

    return {"message": "Room deleted successfully"}

# 💾 CREATE ROOM
@router.post("/rooms/create")
def create_room(room_data: RoomCreate, db: Session = Depends(get_db)):
    try:
        new_room = Room(
            room_number=room_data.roomId,   # ✅ now valid
            rows=room_data.rows,
            cols=room_data.columns
        )

        db.add(new_room)
        db.commit()
        db.refresh(new_room)

        return {
            "success": True,
            "message": "Room created successfully.",
            "data": {
                "id": new_room.id,
                "room_number": new_room.room_number,
                "rows": new_room.rows,
                "cols": new_room.cols,
            },
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to create room: {str(e)}"},
        )


@router.put("/rooms/{room_id}")
def update_room(room_id: int, updated_data: dict, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # ✅ Prevent duplicate room_number
    if "room_number" in updated_data:
        duplicate = db.query(Room).filter(
            Room.room_number == updated_data["room_number"],
            Room.id != room_id
        ).first()

        if duplicate:
            raise HTTPException(status_code=400, detail="Room number already exists")

        room.room_number = updated_data["room_number"]

    if "rows" in updated_data:
        room.rows = updated_data["rows"]

    if "columns" in updated_data:
        room.cols = updated_data["columns"]

    db.commit()
    db.refresh(room)

    return {"message": "Room updated successfully"}

from typing import List
from pydantic import BaseModel

class RoomBulkUpdateItem(BaseModel):
    id: int
    rows: int
    cols: int

class RoomBulkUpdateRequest(BaseModel):
    rooms: List[RoomBulkUpdateItem]

@router.patch("/rooms/bulk-update")
def bulk_update_rooms(payload: RoomBulkUpdateRequest, db: Session = Depends(get_db)):
    try:
        for item in payload.rooms:
            room = db.query(Room).filter(Room.id == item.id).first()
            if not room:
                raise HTTPException(status_code=404, detail=f"Room {item.id} not found")
            room.rows = item.rows
            room.cols = item.cols
        db.commit()
        return {"success": True, "message": f"Updated {len(payload.rooms)} rooms."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))