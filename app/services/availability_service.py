from sqlalchemy.orm import Session
from datetime import date
from app.models.room import Room
from app.models.booking import Booking
from app.models.booking_room import BookingRoom

from app.schemas.booking import BookingUpdate

def get_available_rooms(db: Session, check_in: date, check_out: date):
    """Return a list of all rooms available between the given dates."""
    
    # 1. Identify rooms that ARE booked during this date range
    booked_rooms_query = db.query(BookingRoom.room_id).join(Booking).filter(
        Booking.status.in_(["pending", "confirmed"]),
        Booking.check_in < check_out,
        Booking.check_out > check_in
    )
    
    # 2. Query all active rooms excluding the ones found in step 1
    available_rooms = db.query(Room).filter(
        Room.is_active == True,
        Room.id.not_in(booked_rooms_query)
    ).all()
    
    return available_rooms

def is_room_available(db: Session, room_id: int, check_in: date, check_out: date) -> bool:
    """Check if a specific room is available for the given dates."""
    overlapping_bookings_count = db.query(BookingRoom).join(Booking).filter(
        BookingRoom.room_id == room_id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.check_in < check_out,
        Booking.check_out > check_in
    ).count()
    
    return overlapping_bookings_count == 0

def update_booking(db: Session, booking_id: int, update_data: BookingUpdate):
    """Universal update function for modifying any booking detail."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    # extract only the fields the user actually wants to change
    update_dict = update_data.model_dump(exclude_unset=True) 
    
    # Loop through and update the database model
    for key, value in update_dict.items():
        setattr(booking, key, value)
        
    db.commit()
    db.refresh(booking)
    return booking