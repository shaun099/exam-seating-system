from fastapi import APIRouter
from pydantic import BaseModel
from app.core.supabase_client import supabase

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login_user(request: LoginRequest):
    response = supabase.auth.sign_in_with_password({
        "email": request.email,
        "password": request.password
    })

    if response.user is None:
        return {"error": "Invalid credentials"}

    user_id = response.user.id

    user_data = supabase.table("users") \
        .select("*") \
        .eq("id", user_id) \
        .single() \
        .execute()

    if not user_data.data["is_approved"]:
        return {"error": "Waiting for admin approval"}

    return {
        "id": user_id,
        "role": user_data.data["role"],
        "email": user_data.data["email"]
    }