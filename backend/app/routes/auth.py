from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth_schema import SignupRequest, LoginRequest
from app.services.auth_service import (
    signup_service, 
    login_service, 
    get_current_user, 
    update_password_service
)
from app.db.database import SessionLocal
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup")
def signup(data: SignupRequest):
    return signup_service(data)

@router.post("/login")
def login(data: LoginRequest):
    return login_service(data)

@router.post("/update-password")
def update_password(data: dict, current_user = Depends(get_current_user)):
    """
    Endpoint for users to change their temporary password on first login.
    Expects JSON: {"new_password": "your_new_password"}
    """
    new_password = data.get("new_password")
    
    if not new_password or len(new_password) < 6:
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 6 characters long"
        )
        
    # current_user.user.id is the UUID from the Supabase Auth token
    return update_password_service(current_user.user.id, new_password)

@router.get("/me")
def get_me(user = Depends(get_current_user)):
    db = SessionLocal()
    try:
        db_user = db.query(User).filter(User.id == user.user.id).first()
        
        if not db_user:
            raise HTTPException(status_code=404, detail="User record not found")

        return {
            "full_name": db_user.full_name,
            "email": db_user.email,
            "role": db_user.role
        }
    finally:
        db.close()