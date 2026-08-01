from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal
from app.models.room import Room
from app.models.pricing import SeasonalPricing

def calculate_stay_price(db: Session, room_id: int, check_in: date, check_out: date) -> Decimal:
    """Calculate the total price of a stay, factoring in seasonal rates."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise ValueError("Room not found.")

    # Fetch any seasonal pricing that overlaps with the stay
    seasonal_prices = db.query(SeasonalPricing).filter(
        SeasonalPricing.room_id == room_id,
        SeasonalPricing.start_date < check_out,
        SeasonalPricing.end_date >= check_in
    ).all()

    total_price = Decimal(0)
    current_date = check_in
    
    # Iterate through each night of the stay
    while current_date < check_out:
        daily_price = room.base_price
        
        # Check if the current date is overridden by a seasonal rate
        for sp in seasonal_prices:
            if sp.start_date <= current_date <= sp.end_date:
                daily_price = sp.price_per_night
                break
        
        total_price += daily_price
        current_date += timedelta(days=1)
        
    return total_price