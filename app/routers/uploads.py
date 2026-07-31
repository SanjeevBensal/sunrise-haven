from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.cloudinary_service import upload_room_image

router = APIRouter(prefix="/uploads", tags=["Uploads"])

@router.post("/room-image")
async def upload_image(file: UploadFile = File(...)):
    """Receives an image file and uploads it to Cloudinary."""
    
    # 1. Validate that the uploaded file is actually an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")
    
    try:
        # 2. Pass the raw file to our Cloudinary service
        image_url = upload_room_image(file)
        
        # 3. Return the secure URL to the frontend so it can be saved to the database
        return {"message": "Upload successful!", "url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))