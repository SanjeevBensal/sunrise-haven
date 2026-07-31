from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class SeasonalPricing(Base):
    __tablename__ = "seasonal_pricings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    price_per_night = Column(Numeric(10, 2), nullable=False)
    description = Column(String(100), nullable=True)

    # Relationships
    room = relationship("Room", back_populates="seasonal_pricings")