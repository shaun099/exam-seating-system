from fastapi import FastAPI, APIRouter # type: ignore
from app.routes.healthy import router as health_router
from app.routes.upload import router as upload_router
from app.routes.allocate import router as allocate_router
from app.routes.download import router as download_router
from app.routes.exams import router as exams_router
from app.db.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

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

origins = [
    "http://localhost:5173",   # Vite (React)
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Who can access
    allow_credentials=True,
    allow_methods=["*"],          # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],          # Allow all headers
)
# Base.metadata.drop_all(bind=engine, tables=[
#     SeatAllocation.__table__,
#     Seating.__table__,
#     Allocation.__table__,
#     Student.__table__,
#     Course.__table__,
#     Exam.__table__,
#     Branch.__table__,
#     Room.__table__,
# ])
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


app.include_router(v1_router)
