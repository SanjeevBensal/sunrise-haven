from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
import calendar
from decimal import Decimal

from app.models.booking import Booking
from app.models.room import Room

def get_monthly_metrics(db: Session, year: int, month: int) -> dict:
    """Calculates revenue, booking counts, and occupancy rates for a given month."""
    
    # 1. Total Bookings & Revenue
    # We only count 'confirmed' bookings for accurate revenue
    metrics_query = db.query(
        func.count(Booking.id).label("total_bookings"),
        func.sum(Booking.total_amount).label("monthly_revenue")
    ).filter(
        extract('year', Booking.check_in) == year,
        extract('month', Booking.check_in) == month,
        Booking.status == 'confirmed'
    ).first()

    total_bookings = metrics_query.total_bookings or 0
    monthly_revenue = metrics_query.monthly_revenue or Decimal('0.00')

    # 2. Occupancy Metrics
    # Total available room nights = (Number of active rooms) * (Days in the month)
    days_in_month = calendar.monthrange(year, month)[1]
    active_rooms_count = db.query(func.count(Room.id)).filter(Room.is_active == True).scalar() or 0
    total_available_nights = active_rooms_count * days_in_month

    # Calculate booked nights for the month
    # For simplicity, this calculates nights based on the check-in date falling in the target month.
    booked_nights_query = db.query(
        func.sum(
            func.cast(
                func.extract('day', Booking.check_out) - func.extract('day', Booking.check_in), 
                func.Integer()
            )
        )
    ).filter(
        extract('year', Booking.check_in) == year,
        extract('month', Booking.check_in) == month,
        Booking.status == 'confirmed'
    ).scalar()

    booked_nights = booked_nights_query or 0

    # Calculate Occupancy Rate percentage
    occupancy_rate = 0.0
    if total_available_nights > 0:
        occupancy_rate = round((booked_nights / total_available_nights) * 100, 2)

    return {
        "monthly_revenue": monthly_revenue,
        "total_bookings": total_bookings,
        "occupancy_rate": occupancy_rate,
        "month": month,
        "year": year
    }