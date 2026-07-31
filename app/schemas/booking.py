from pydantic import BaseModel, Field
from typing import List
from datetime import date
from decimal import Decimal

from typing import Optional

class BookingUpdate(BaseModel):
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    guests: Optional[int] = None
    total_amount: Optional[Decimal] = None
    special_requests: Optional[str] = None
    status: Optional[str] = None
    room_id: Optional[int] = None

# Incoming Data: Choosing a room
class BookingRoomCreate(BaseModel):
    room_id: int

# Incoming Data: Creating the full booking
class BookingCreate(BaseModel):
    room_id: int
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in: date
    check_out: date
    guests: int
    total_amount: Decimal
    special_requests: Optional[str] = None

# Outgoing Data: What the API returns to the frontend
class BookingOut(BaseModel):
    id: int
    booking_reference: str
    guest_name: str
    check_in: date
    check_out: date
    total_amount: Decimal
    status: str
    room_id: Optional[int] = None

    class Config:
        from_attributes = True