import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Sunrise Haven API"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET")

settings = Settings()