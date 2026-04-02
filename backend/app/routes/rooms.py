from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.room_service import RoomService

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"],
)


@router.get("/", summary="Get all rooms")
def get_all_rooms(db: Session = Depends(get_db)):
    """
    Returns all rooms from the database.
    """
    try:
        rooms = RoomService.get_all_rooms(db)
        return {
            "success": True,
            "message": "Rooms fetched successfully.",
            "data": rooms,
            "count": len(rooms),
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": str(e.detail)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Error fetching rooms: {str(e)}"},
        )
