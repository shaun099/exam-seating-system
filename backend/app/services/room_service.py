from sqlalchemy.orm import Session

from app.models.room import Room


class RoomService:
    @staticmethod
    def get_all_rooms(db: Session) -> list[dict]:
        """
        Fetch all room records and serialize for API response.
        """
        rooms = db.query(Room).all()

        return [
            {
                "id": room.id,
                "room_number": room.room_number,
                "rows": room.rows,
                "cols": room.cols,
            }
            for room in rooms
        ]
