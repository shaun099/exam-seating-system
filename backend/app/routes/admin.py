from fastapi import APIRouter, Depends, HTTPException
from app.db.database import SessionLocal
from app.models.user import User
from app.services.auth_service import (
    get_current_user, 
    approve_user_service, 
    revoke_user_service, 
    bulk_create_service
)
from app.schemas.auth_schema import BulkCreateRequest

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/bulk-create")
def bulk_create(data: BulkCreateRequest, user = Depends(get_current_user)):
    db = SessionLocal()
    admin = db.query(User).filter(User.id == user.user.id).first()
    db.close()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return bulk_create_service(data)

@router.post("/approve/{user_id}")
def approve(user_id: str, user = Depends(get_current_user)):
    return approve_user_service(user_id)

@router.post("/revoke/{user_id}")
def revoke(user_id: str, user = Depends(get_current_user)):
    return revoke_user_service(user_id)

@router.get("/users")
def get_users(user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.role == "staff").all()
        return [
            {
                "id": str(u.id),
                "name": u.full_name,
                "email": u.email,
                "requestedAt": str(u.created_at),
                "status": "approved" if u.is_approved else "pending"
            } for u in users
        ]
    finally:
        db.close()