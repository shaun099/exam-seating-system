from supabase import create_client
import os
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from fastapi import HTTPException, Header
from dotenv import load_dotenv

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Make sure this is in your .env file
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") 

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

def bulk_create_service(data):
    db: Session = SessionLocal()
    created_count = 0
    errors = []

    for item in data.users:
        try:
            # 1. Create User in Supabase Auth (Admin API bypasses confirmation)
            res = supabase_admin.auth.admin.create_user({
                "email": item.email,
                "password": data.default_password,
                "email_confirm": True,
                "user_metadata": { 
                    "full_name": item.name, 
                    "temp_password": True 
                }
            })

            if not res or not res.user:
                errors.append({"email": item.email, "error": "Auth creation failed"})
                continue

            # 2. Sync to local database as Pre-Approved
            db_user = User(
                id=res.user.id,
                email=item.email,
                full_name=item.name,
                role="staff",
                is_approved=True 
            )
            db.add(db_user)
            db.commit()
            created_count += 1

        except Exception as e:
            db.rollback()
            errors.append({"email": item.email, "error": str(e)})

    db.close()
    return {
        "message": "Bulk processing complete",
        "created": created_count,
        "skipped": len(errors),
        "details": errors
    }

def signup_service(data):
    db: Session = SessionLocal()
    try:
        res = supabase.auth.sign_up({"email": data.email, "password": data.password})
        if not res or not res.user:
            raise HTTPException(status_code=400, detail="Signup failed")
        db_user = User(id=res.user.id, email=data.email, full_name=data.full_name, role="staff", is_approved=False)
        db.add(db_user)
        db.commit()
        return {"message": "Signup successful. Wait for admin approval."}
    finally:
        db.close()

def login_service(data):
    db: Session = SessionLocal()
    res = supabase.auth.sign_in_with_password({"email": data.email, "password": data.password})
    user = res.user
    if not user:
        raise Exception("Invalid credentials")
    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise Exception("User not found")
    if db_user.role == "staff" and not db_user.is_approved:
        raise Exception("Not approved by admin")
    return {
        "access_token": res.session.access_token,
        "role": db_user.role,
        "user_id": db_user.id,
        "needs_password_change": user.user_metadata.get("temp_password", False)
    }

def approve_user_service(user_id: str):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_approved = True
        db.commit()
    db.close()
    return {"message": "User approved"}

def revoke_user_service(user_id: str):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_approved = False
        db.commit()
    db.close()
    return {"message": "Access revoked"}