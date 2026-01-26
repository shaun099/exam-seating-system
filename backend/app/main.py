from fastapi import FastAPI
from app.routes.healthy import router as health_router

app=FastAPI(
    title="EXAM SEATING ALLOCATION API",
    description="Backend API for exam seating arrangement system",
    version="1.0.0"
)


@app.get("/", summary="Root endpoint")
def root():
    return {
        "message": "API is running"
    }
app.include_router(health_router)
