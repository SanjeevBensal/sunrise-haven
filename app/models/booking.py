from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(20), unique=True, nullable=False, index=True)  # e.g. SH-1042
    
    # New columns for public guest checkout
    guest_name = Column(String(100), nullable=False)
    guest_email = Column(String(100), nullable=False)
    guest_phone = Column(String(20), nullable=False)
    guests = Column(Integer, nullable=False, default=1)
    special_requests = Column(Text, nullable=True)

    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, confirmed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    booking_rooms = relationship("BookingRoom", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")