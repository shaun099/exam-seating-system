# app/routes/health.py

from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)

@router.get("/", summary="Health check")
def health_check():
    return {
        "status": "healthy",
        "message": "Exam Seating Allocation API is running"
    }
