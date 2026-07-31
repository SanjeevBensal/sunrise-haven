from fastapi import UploadFile
from app.integrations import cloudinary
import cloudinary.uploader

def upload_room_image(file: UploadFile) -> str:
    """Uploads an image to Cloudinary and returns the secure URL."""
    try:
        # Upload the file stream directly to a specific folder
        result = cloudinary.uploader.upload(
            file.file, 
            folder="sunrise_haven/rooms"
        )
        return result.get("secure_url")
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")