from supabase import create_client
import os
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from fastapi import HTTPException
from fastapi import Header

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]

        user = supabase.auth.get_user(token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user

    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

def signup_service(data):
    db: Session = SessionLocal()

    try:
        # 🔹 Create user in Supabase Auth
        res = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })

        if not res or not res.user:
            raise HTTPException(status_code=400, detail="Signup failed in Supabase")

        # 🔹 Use SAME ID from Supabase
        user_id = res.user.id

        # 🔹 Insert into your table
        db_user = User(
            id=user_id,
            email=data.email,
            full_name=data.full_name,
            role="staff",
            is_approved=False
        )

        db.add(db_user)
        db.commit()

        return {"message": "Signup successful. Wait for admin approval."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


def login_service(data):
    email = data.email
    password = data.password
    db: Session = SessionLocal()

    res = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

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
        "user_id": db_user.id
    }


def approve_user_service(user_id: str):
    db: Session = SessionLocal()

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise Exception("User not found")

    user.is_approved = True
    db.commit()

    return {"message": "User approved"}


def revoke_user_service(user_id: str):
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            return {"error": "User not found"}
        user.is_approved = False

        db.commit()

        return {"message": "Access revoked"}

    finally:
        db.close()