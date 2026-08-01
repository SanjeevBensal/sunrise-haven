from sqlalchemy.orm import Session
from app.models.room import Room

def get_active_rooms(db: Session, skip: int = 0, limit: int = 100):
    """Fetch all active rooms for the main listing."""
    return db.query(Room).filter(Room.is_active == True).offset(skip).limit(limit).all()

def get_room_by_id(db: Session, room_id: int):
    """Fetch a specific room by its ID."""
    return db.query(Room).filter(Room.id == room_id, Room.is_active == True).first()