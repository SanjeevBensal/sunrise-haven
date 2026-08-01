import random
from sqlalchemy.orm import Session
from datetime import date
from fastapi import HTTPException
from app.models.booking import Booking
from app.models.booking_room import BookingRoom
from app.services.availability_service import is_room_available
from app.services.pricing_service import calculate_stay_price
from app.schemas.booking import BookingCreate, BookingUpdate # Added BookingUpdate here!

from app.models.room import Room

def generate_booking_reference() -> str:
    """Generates a reference like SH-1042."""
    return f"SH-{random.randint(1000, 9999)}"

def create_booking(db: Session, booking_data: BookingCreate):
    if booking_data.check_in >= booking_data.check_out:
         raise HTTPException(status_code=400, detail="Check-out must be after check-in.")

    stay_duration = (booking_data.check_out - booking_data.check_in).days

    # 1. Single-room availability check
    if not is_room_available(db, booking_data.room_id, booking_data.check_in, booking_data.check_out):
        raise HTTPException(
            status_code=400, 
            detail=f"Room ID {booking_data.room_id} is not available for these dates."
        )
    
    # Utilize the Pricing Service to verify the total (safer than trusting the frontend)
    price = calculate_stay_price(db, booking_data.room_id, booking_data.check_in, booking_data.check_out)

    # 2. Create the parent Booking record with the public guest details
    new_booking = Booking(
        booking_reference=generate_booking_reference(),
        guest_name=booking_data.guest_name,
        guest_email=booking_data.guest_email,
        guest_phone=booking_data.guest_phone,
        guests=booking_data.guests,
        special_requests=booking_data.special_requests,
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        total_amount=price, 
        status="pending" # Default status before payment or owner approval
    )
    db.add(new_booking)
    db.flush() # Flushes to DB to generate the booking ID without committing the transaction

    # 3. Create the BookingRoom association (Single-room flow)
    booking_room = BookingRoom(
        booking_id=new_booking.id,
        room_id=booking_data.room_id,
        price_per_night=price / stay_duration 
    )
    db.add(booking_room)

    # 4. Commit the entire transaction
    db.commit()
    db.refresh(new_booking)
    return new_booking

# This is the brand new universal update function!
def update_booking(db: Session, booking_id: int, update_data: BookingUpdate):
    """Universal update function for modifying any booking detail."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    update_dict = update_data.model_dump(exclude_unset=True) 
    
    # --- BULLETPROOF ROOM ID UPDATE ---
    if "room_id" in update_dict:
        new_room_id = update_dict.pop("room_id")
        
        # 1. Verify the room actually exists in the database first
        room_exists = db.query(Room).filter(Room.id == new_room_id).first()
        if not room_exists:
            raise HTTPException(status_code=400, detail=f"Room ID {new_room_id} does not exist.")
            
        # 2. Use a direct SQL update to safely override the Foreign Key
        existing_br = db.query(BookingRoom).filter(BookingRoom.booking_id == booking_id).first()
        if existing_br:
            db.query(BookingRoom).filter(BookingRoom.booking_id == booking_id).update({"room_id": new_room_id})
        else:
            # Fallback if no room was attached yet
            new_br = BookingRoom(booking_id=booking_id, room_id=new_room_id, price_per_night=0)
            db.add(new_br)
    # ----------------------------------
    
    # Loop through and update standard fields
    for key, value in update_dict.items():
        setattr(booking, key, value)
        
    db.commit()
    db.refresh(booking)
    return booking

def delete_booking(db: Session, booking_id: int):
    """Deletes a booking and its associated room link from the database."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    # 1. Clean up the junction table first to prevent Foreign Key errors
    booking_room = db.query(BookingRoom).filter(BookingRoom.booking_id == booking_id).first()
    if booking_room:
        db.delete(booking_room)
        
    # 2. Delete the main booking record
    db.delete(booking)
    db.commit()
    
    return {"message": f"Booking {booking_id} successfully deleted."}