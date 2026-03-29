from fastapi import APIRouter
from app.schemas.auth_schema import SignupRequest, LoginRequest
from app.services.auth_service import signup_service, login_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup")
def signup(data: SignupRequest):
    return signup_service(data)

@router.post("/login")
def login(data: LoginRequest):
    return login_service(data)

