from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
import cloudinary.uploader

from app.middleware.auth import get_current_admin
from app.middleware.logger import logger # <--- Import the logger for admin actions
from app.database.database import get_db
from app.models.room import Room
from app.models.booking import Booking
from app.models.booking_room import BookingRoom
from app.models.room_image import RoomImage 
from app.utils.limiter import limiter

router = APIRouter(prefix="/rooms", tags=["Rooms"])

# ==========================================
# 1. SCHEMAS
# ==========================================
class RoomCreateQuick(BaseModel):
    name: str
    description: str
    capacity: int
    beds: int
    view_tag: str
    base_price: Decimal

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    beds: Optional[int] = None
    view_tag: Optional[str] = None
    base_price: Optional[Decimal] = None

class RoomImageOut(BaseModel):
    id: int
    image_url: str 
    class Config:
        from_attributes = True

class RoomOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    capacity: int
    beds: int
    view_tag: Optional[str] = None
    base_price: Decimal
    is_active: bool
    images: List[RoomImageOut] = [] 

    class Config:
        from_attributes = True

class ImageDeleteRequest(BaseModel):
    image_url: str

# ==========================================
# 2. CUSTOMER ENDPOINTS (No locks needed here)
# ==========================================
@router.get("/available", response_model=List[RoomOut])
def get_available_rooms(
    check_in: date,
    check_out: date,
    capacity: int = Query(None, description="Filter by guest capacity"),
    db: Session = Depends(get_db)
):
    """Returns a list of rooms available for the given date range, including images."""
    overlapping_bookings = db.query(BookingRoom.room_id).join(Booking).filter(
        Booking.status == 'confirmed',
        Booking.check_in < check_out,
        Booking.check_out > check_in
    ).subquery()

    query = db.query(Room).filter(
        Room.is_active == True,
        ~Room.id.in_(overlapping_bookings)
    )

    if capacity:
        query = query.filter(Room.capacity >= capacity)

    return query.all()

@router.get("/calendar")
def get_calendar_availability(year: int, month: int, db: Session = Depends(get_db)):
    """Returns frontend calendar dot status."""
    # Returning an empty dictionary until you build the complex DB logic later!
    return {}

@router.get("/public", response_model=List[RoomOut])
def get_public_rooms(db: Session = Depends(get_db)):
    """Fetch all active rooms to display on the public homepage."""
    return db.query(Room).filter(Room.is_active == True).limit(3).all()

# ==========================================
# 3. OWNER DASHBOARD ENDPOINTS (Locked)
# ==========================================
@router.get("/all", response_model=List[RoomOut])
def get_all_rooms(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    """Fetch all rooms (and their images) for the owner dashboard."""
    return db.query(Room).all()

@router.post("/", response_model=RoomOut)
def create_room(room_in: RoomCreateQuick, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    """API Endpoint for Owners to create a new room."""
    new_room = Room(**room_in.model_dump())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    logger.info(f"Admin action: '{admin.email}' created a new room ID {new_room.id} ({new_room.name})")
    return new_room

@router.patch("/{room_id}", response_model=RoomOut)
def update_room(room_id: int, room_data: RoomUpdate, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    """Edit room details."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    
    for key, value in room_data.model_dump(exclude_unset=True).items():
        setattr(room, key, value)
        
    db.commit()
    db.refresh(room)
    
    logger.info(f"Admin action: '{admin.email}' updated room ID {room_id}")
    return room

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    """Delete a room entirely."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    
    db.delete(room)
    db.commit()
    
    logger.info(f"Admin action: '{admin.email}' deleted room ID {room_id}")
    return {"message": "Room successfully deleted"}

# ==========================================
# 4. CLOUDINARY UPLOAD ENDPOINTS (Locked)
# ==========================================
@router.post("/{room_id}/images")
@limiter.limit("5/minute") 
async def upload_room_images(
    request: Request, 
    room_id: int, 
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Uploads multiple images to Cloudinary and links them to the room in the DB."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    uploaded_count = 0
    for file in files:
        result = cloudinary.uploader.upload(file.file)
        
        new_image = RoomImage(
            room_id=room_id, 
            image_url=result.get("secure_url") 
        )
        db.add(new_image)
        uploaded_count += 1
        
    db.commit()
    logger.info(f"Admin action: '{admin.email}' uploaded {uploaded_count} images to room ID {room_id}")
    return {"message": f"Successfully uploaded {uploaded_count} images."}

@router.post("/{room_id}/remove-image")
def remove_room_image(
    room_id: int, 
    req: ImageDeleteRequest, 
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """API Endpoint to remove a specific image from a room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
        
    for img in room.images:
        if img.image_url == req.image_url:
            db.delete(img)
            db.commit()
            logger.info(f"Admin action: '{admin.email}' removed an image from room ID {room_id}")
            return {"message": "Image removed successfully!"}
            
    raise HTTPException(status_code=404, detail="Image not found.")