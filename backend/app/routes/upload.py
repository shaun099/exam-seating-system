from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
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
def delete_room(
    room_id: int,
    db: Session = Depends(get_db)
):
    try:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        deleted_data = {
            "id": room.id,
            "roomId": room.roomId if hasattr(room, "roomId") else None,
            "blockName": room.blockName if hasattr(room, "blockName") else None
        }

        db.delete(room)
        db.commit()

        return {
            "success": True,
            "message": "Room deleted successfully",
            "deleted_room": deleted_data
        }

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to delete room: {str(e)}"},
        )

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
# ✏️ UPDATE ROOM

@router.put("/rooms/{room_id}")
def update_room(room_id: int, updated_data: dict, db: Session = Depends(get_db)):
    try:
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

        return {
            "success": True,
            "message": "Room updated successfully.",
            "data": {
                "id": room.id,
                "room_number": room.room_number,
                "rows": room.rows,
                "cols": room.cols,
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
            content={"success": False, "message": f"Failed to update room: {str(e)}"},
        )