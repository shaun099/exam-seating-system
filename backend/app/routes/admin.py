from fastapi import APIRouter
from app.services.auth_service import approve_user_service, revoke_user_service
from app.db.database import SessionLocal

from app.models.user import User  

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/approve/{user_id}")
def approve(user_id: str):
    return approve_user_service(user_id)


@router.post("/revoke/{user_id}")
def revoke(user_id: str):
    return revoke_user_service(user_id)


@router.get("/users")
def get_users():
    db = SessionLocal()

    try:
        users = db.query(User).all()

        return [
            {
                "id": str(u.id),
                "name": u.full_name,
                "email": u.email,
                "requestedAt": str(u.created_at),
                "status": "approved" if u.is_approved else "pending"
            }
            for u in users if u.role == "staff"
        ]

    finally:
        db.close()