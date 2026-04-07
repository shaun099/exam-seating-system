from fastapi import APIRouter, UploadFile, File, Depends, HTTPException,Form, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.schemas.room_schema import RoomCreate
from app.db.database import get_db
from app.services.upload_service import UploadService
from app.models.room import Room   # ✅ IMPORTANT
import os, aiofiles
import traceback

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



CHUNK_DIR = "/tmp/upload_chunks"
os.makedirs(CHUNK_DIR, exist_ok=True)

@router.post("/students/chunk")
async def upload_student_chunk(
    chunk: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    filename: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        os.makedirs(CHUNK_DIR, exist_ok=True)

        # Save chunk
        chunk_path = f"{CHUNK_DIR}/{upload_id}_chunk_{chunk_index}"
        async with aiofiles.open(chunk_path, "wb") as f:
            await f.write(await chunk.read())

        # Check ALL expected chunks exist by index (safer than counting)
        all_exist = all(
            os.path.exists(f"{CHUNK_DIR}/{upload_id}_chunk_{i}")
            for i in range(total_chunks)
        )

        if not all_exist:
            received = len([
                n for n in os.listdir(CHUNK_DIR)
                if n.startswith(f"{upload_id}_chunk_")
            ])
            return {"status": "chunk_received", "received": received, "total": total_chunks}

        # Merge all chunks in order
        final_path = f"{CHUNK_DIR}/{upload_id}_final"
        async with aiofiles.open(final_path, "wb") as final_file:
            for i in range(total_chunks):
                cp = f"{CHUNK_DIR}/{upload_id}_chunk_{i}"
                async with aiofiles.open(cp, "rb") as cf:
                    await final_file.write(await cf.read())
                os.remove(cp)

        # Read merged file
        async with aiofiles.open(final_path, "rb") as f:
            content = await f.read()
        os.remove(final_path)

        # Fake UploadFile wrapper
        class FakeUploadFile:
            def __init__(self, content: bytes, filename: str):
                self._content = content
                self.filename = filename
            async def read(self) -> bytes:
                return self._content

        fake_file = FakeUploadFile(content, filename)
        result = await UploadService.process_upload(fake_file, db)

        return {"status": "complete", **result}

    except HTTPException:
        raise  # let FastAPI handle known HTTP errors as-is

    except Exception as e:
        traceback.print_exc()  # ← full stack trace in your Render/local logs
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed at chunk {chunk_index}/{total_chunks}: {str(e)}"
        )