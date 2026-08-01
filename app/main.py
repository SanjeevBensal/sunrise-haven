from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.utils.limiter import limiter  # <--- Import our new limiter

from app.config import settings
from app.middleware.logger import LoggingMiddleware, logger
from app.routers import bookings, payments, dashboard, auth, rooms, uploads, concierge

# 1. IMPORT YOUR MODELS HERE
from app.models import admin 
from app.models import booking, room, payment 
from app.database.session import engine
from app.database.base import Base

# 2. INITIALIZE APP
app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.include_router(concierge.router)

# Custom handler so the frontend doesn't crash with a CORS "Failed to fetch" error
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit triggered for IP: {request.client.host}")
    return JSONResponse(
        status_code=429,
        content={
            "error": True, 
            "message": "Too many login attempts! Please wait 60 seconds before trying again."
        },
        headers={"Access-Control-Allow-Origin": "*"} 
    )

# --------------------------
# CLOUDINARY & STATIC FILES
# --------------------------
import cloudinary
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

load_dotenv() 

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

os.makedirs("static/uploads/rooms", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# 3. ADD CORS MIDDLEWARE (Fixed configuration)
# Replace the URLs in this list with your actual frontend URLs
origins = [
    "http://localhost:5173", # Default port for Vite
    "http://localhost:3000", # Default port for React/Next.js
    # "https://your-future-vercel-frontend-url.vercel.app", # Uncomment later!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Uses the secure list above instead of ["*"]
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# 4. ADD CUSTOM MIDDLEWARE
app.add_middleware(LoggingMiddleware)

# NOTE: Base.metadata.create_all(bind=engine) was removed. 
# Alembic is handling your Supabase migrations now!

# 5. INCLUDE ROUTERS
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(uploads.router)

# ==========================================
# ROOT ENDPOINT (Fixes Render 404 warnings)
# ==========================================
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Sunrise Haven API is live and running on Render!"}

# ==========================================
# EXCEPTION HANDLERS
# ==========================================
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP Error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"error": True, "message": "Invalid data submitted.", "details": exc.errors()},
    )

# ==========================================
# HEALTH CHECK
# ==========================================
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}