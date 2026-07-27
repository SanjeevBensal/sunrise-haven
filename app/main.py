from fastapi import FastAPI
from app.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Sunrise Haven booking system using FastAPI, PostgreSQL, and Supabase."
)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "message": "Phase 1 initialized successfully."
    }