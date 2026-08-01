from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    supabase_id = Column(String(255), unique=True, nullable=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
