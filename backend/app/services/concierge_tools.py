from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import date
from app.models.room import Room
from app.models.booking import Booking
from app.models.booking_room import BookingRoom

# Tool 1: Check Live Room Availability
def tool_check_availability(db: Session, check_in: str, check_out: str, capacity: Optional[int] = None) -> Dict[str, Any]:
    try:
        c_in = date.fromisoformat(check_in)
        c_out = date.fromisoformat(check_out)
        
        overlapping = db.query(BookingRoom.room_id).join(Booking).filter(
            Booking.status == 'confirmed',
            Booking.check_in < c_out,
            Booking.check_out > c_in
        ).subquery()

        query = db.query(Room).filter(Room.is_active == True, ~Room.id.in_(overlapping))
        if capacity:
            query = query.filter(Room.capacity >= capacity)

        rooms = query.all()
        return {
            "status": "success",
            "available_count": len(rooms),
            "rooms": [
                {
                    "id": r.id,
                    "name": r.name,
                    "price": float(r.base_price),
                    "capacity": r.capacity,
                    "view": r.view_tag,
                    "images": [img.image_url for img in r.images]
                } for r in rooms
            ]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Tool 2: Check Booking Status by Reference
def tool_get_booking_status(db: Session, booking_ref: str) -> Dict[str, Any]:
    booking = db.query(Booking).filter(Booking.booking_reference == booking_ref.upper()).first()
    if not booking:
        return {"status": "not_found", "message": "No booking found with that reference number."}
    
    return {
        "status": "success",
        "reference": booking.booking_reference,
        "guest_name": booking.guest_name,
        "booking_status": booking.status, # Pending, Confirmed, Checked In, etc.
        "check_in": str(booking.check_in),
        "check_out": str(booking.check_out),
        "total_amount": float(booking.total_amount)
    }

# Tool 3: Local Baguio Knowledge Base
def tool_get_baguio_guide(category: Optional[str] = None) -> Dict[str, Any]:
    guide = {
        "food": [
            {"name": "Cafe by the Ruins", "type": "Filipino / Cafe", "time_from_haven": "15 mins", "highlight": "Authentic Cordillera breakfast & hot chocolate"},
            {"name": "Farmer's Daughter", "type": "Native Cuisine", "time_from_haven": "20 mins", "highlight": "Traditional smoked meats (Etag) and Pinikpikan"}
        ],
        "nature": [
            {"name": "Camp John Hay", "type": "Park / Pine Trails", "time_from_haven": "10 mins", "highlight": "Pine tree canopy walks, zipline, yellow trail"},
            {"name": "Mirador Heritage Park", "type": "Scenic Viewpoint", "time_from_haven": "18 mins", "highlight": "Torii gate, rock garden, sunset overlooking Baguio"}
        ],
        "culture": [
            {"name": "BenCab Museum", "type": "Art Museum", "time_from_haven": "25 mins", "highlight": "Masterpieces by Benedicto Cabrera and Igorot tribal art"}
        ]
    }
    return guide.get(category, guide)