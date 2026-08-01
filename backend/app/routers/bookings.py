from typing import List
from datetime import date
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingOut, BookingUpdate
from app.services.booking_service import create_booking, update_booking, delete_booking
from app.services.availability_service import get_available_rooms
from app.models.booking_room import BookingRoom
from app.utils.limiter import limiter 
from app.middleware.logger import logger # <--- Import the logger!

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("/availability")
def check_availability(check_in: date, check_out: date, db: Session = Depends(get_db)):
    rooms = get_available_rooms(db, check_in, check_out)
    return {"available_rooms": rooms}

@router.get("/", response_model=List[BookingOut])
def get_all_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.id.desc()).all()
    
    result = []
    for b in bookings:
        br = db.query(BookingRoom).filter(BookingRoom.booking_id == b.id).first()
        
        result.append(
            BookingOut(
                id=b.id,
                booking_reference=b.booking_reference,
                guest_name=b.guest_name,
                check_in=b.check_in,
                check_out=b.check_out,
                total_amount=b.total_amount,
                status=b.status,
                room_id=br.room_id if br else None 
            )
        )
    return result

@router.post("/", response_model=BookingOut)
@limiter.limit("3/minute") 
def create_new_booking(request: Request, booking: BookingCreate, db: Session = Depends(get_db)):
    # Create the booking first
    result = create_booking(db, booking)
    
    # Log the successful creation (avoiding sensitive data)
    logger.info(f"Booking created successfully: Ref {result.booking_reference} for guest {result.guest_name}")
    return result

@router.patch("/{booking_id}", response_model=BookingOut)
def update_existing_booking(booking_id: int, update_data: BookingUpdate, db: Session = Depends(get_db)):
    result = update_booking(db, booking_id, update_data)
    logger.info(f"Booking updated: ID {booking_id} status changed to '{result.status}'")
    return result

@router.delete("/{booking_id}")
def remove_booking(booking_id: int, db: Session = Depends(get_db)):
    # Log the cancellation/removal
    logger.info(f"Booking cancelled/deleted: ID {booking_id}")
    return delete_booking(db, booking_id)