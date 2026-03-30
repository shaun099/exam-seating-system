from fastapi import APIRouter
from app.schemas.auth_schema import SignupRequest, LoginRequest
from app.services.auth_service import signup_service, login_service
from fastapi import Depends
from app.services.auth_service import get_current_user
from app.db.database import SessionLocal
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup")
def signup(data: SignupRequest):
    return signup_service(data)

@router.post("/login")
def login(data: LoginRequest):
    return login_service(data)

@router.get("/me")
def get_me(user = Depends(get_current_user)):
    db = SessionLocal()

    db_user = db.query(User).filter(User.id == user.user.id).first()

    db.close()

    return {
        "full_name": db_user.full_name,
        "email": db_user.email
    }