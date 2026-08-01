from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.amenity import room_amenities

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    capacity = Column(Integer, nullable=False)
    beds = Column(Integer, nullable=False, default=1)
    size_sqm = Column(Numeric(5, 2), nullable=True)
    view_tag = Column(String(50), nullable=True)  # e.g., 'Ridge view', 'Pine view'
    is_active = Column(Boolean, default=True)

    # Relationships
    images = relationship("RoomImage", back_populates="room", cascade="all, delete-orphan")
    seasonal_pricings = relationship("SeasonalPricing", back_populates="room", cascade="all, delete-orphan")
    amenities = relationship("Amenity", secondary=room_amenities, back_populates="rooms")
    booking_rooms = relationship("BookingRoom", back_populates="room")