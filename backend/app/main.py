import logging

logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

from fastapi import FastAPI, APIRouter  # type: ignore
from app.routes.healthy import router as health_router
from app.routes.allocate import router as allocate_router, seat_allocations_router
from app.routes.upload import router as upload_router
from app.routes.download import router as download_router
from app.routes.exams import router as exams_router
from app.db.database import Base, engine
from app.routes import auth, admin
from fastapi.middleware.cors import CORSMiddleware
import os

import app.models
from app.models import (
    SeatAllocation,
    Seating,
    Allocation,
    Student,
    Course,
    Exam,
    Branch,
    Room,
)

app=FastAPI(
    title="EXAM SEATING ALLOCATION API",
    description="Backend API for exam seating arrangement system",
    version="1.0.0"
)

origins = os.getenv("CORS_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ THEN use it
app.include_router(auth.router)
app.include_router(admin.router)
Base.metadata.drop_all(bind=engine, tables=[
    SeatAllocation.__table__,
    Seating.__table__,
    Allocation.__table__,
    Student.__table__,
    Course.__table__,
    Exam.__table__,
    Branch.__table__,
    Room.__table__,
])

Base.metadata.create_all(bind=engine)


@app.get("/", summary="Root endpoint")
def root():
    return {
        "message": "API is running"
    }


v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(health_router)
v1_router.include_router(upload_router)
v1_router.include_router(allocate_router)
v1_router.include_router(download_router)
v1_router.include_router(exams_router)
v1_router.include_router(seat_allocations_router)

app.include_router(v1_router)
