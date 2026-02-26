from fastapi import FastAPI
from app.routes.healthy import router as health_router
from app.core.supabase_client import supabase
from app.controllers.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(
    title="EXAM SEATING ALLOCATION API",
    description="Backend API for exam seating arrangement system",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)

@app.get("/", summary="Root endpoint")
def root():
    return {
        "message": "API is running"
    }
app.include_router(health_router)
