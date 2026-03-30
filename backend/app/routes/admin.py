from fastapi import APIRouter, Depends
from app.services.auth_service import approve_user_service, revoke_user_service
from app.db.database import SessionLocal
from app.services.auth_service import get_current_user
from app.models.user import User  
from fastapi import HTTPException
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/approve/{user_id}")
def approve(user_id: str, user = Depends(get_current_user)):
    db = SessionLocal()

    db_user = db.query(User).filter(User.id == user.user.id).first()

    if db_user.role != "admin":
        db.close()
        raise HTTPException(status_code=403, detail="Admin only")

    db.close()
    return approve_user_service(user_id)

@router.post("/revoke/{user_id}")
def revoke(user_id: str, user = Depends(get_current_user)):
    db = SessionLocal()

    db_user = db.query(User).filter(User.id == user.user.id).first()

    if db_user.role != "admin":
        db.close()
        raise HTTPException(status_code=403, detail="Admin only")

    db.close()
    return revoke_user_service(user_id)


@router.get("/users")
def get_users(user = Depends(get_current_user)):
    db = SessionLocal()

    db_user = db.query(User).filter(User.id == user.user.id).first()

    if db_user.role != "admin":
        db.close()
        raise HTTPException(status_code=403, detail="Admin only")

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