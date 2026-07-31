# test_services.py
from datetime import date
from app.database.session import SessionLocal
from app.models.room import Room
from app.services.room_service import get_active_rooms
from app.services.availability_service import get_available_rooms
from app.services.pricing_service import calculate_stay_price

def run_tests():
    db = SessionLocal()
    try:
        # 1. Create a dummy room directly in the DB for testing
        test_room = Room(
            name="The Firstlight Room", 
            base_price=4200.00, 
            capacity=2,
            is_active=True
        )
        db.add(test_room)
        db.commit()
        db.refresh(test_room)
        print(f"Created test room ID: {test_room.id}")

        # 2. Test Room Service
        rooms = get_active_rooms(db)
        print(f"Total active rooms found: {len(rooms)}")

        # 3. Test Availability Service
        # Should be available since we have no bookings yet
        check_in = date(2026, 8, 12)
        check_out = date(2026, 8, 14)
        available = get_available_rooms(db, check_in, check_out)
        print(f"Rooms available for August 12-14: {len(available)}")

        # 4. Test Pricing Service
        # 2 nights at base price 4200 = 8400
        price = calculate_stay_price(db, test_room.id, check_in, check_out)
        print(f"Total price for 2 nights: ₱{price}")

    finally:
        # Clean up database after test
        db.delete(test_room)
        db.commit()
        db.close()

if __name__ == "__main__":
    run_tests()