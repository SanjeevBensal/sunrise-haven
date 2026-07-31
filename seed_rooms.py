# seed_rooms.py
from app.database.session import SessionLocal
from app.models.room import Room

def seed_database():
    db = SessionLocal()
    
    try:
        # 1. Check if rooms already exist to prevent duplicates if run twice
        if db.query(Room).count() > 0:
            print("Database already contains rooms. Skipping seed process.")
            return

        # 2. The exact rooms from your original Sunrise Haven design
        rooms_to_create = [
            {
                "name": "The Firstlight Room",
                "view_tag": "Ridge view",
                "capacity": 2,
                "beds": 1,
                "base_price": 4200.00,
                "is_active": True
            },
            {
                "name": "The Understory Suite",
                "view_tag": "Pine view",
                "capacity": 4,
                "beds": 2,
                "base_price": 6800.00,
                "is_active": True
            },
            {
                "name": "The Amber Loft",
                "view_tag": "Golden hour",
                "capacity": 3,
                "beds": 1,
                "base_price": 5600.00,
                "is_active": True
            },
            {
                "name": "The Fogline Room",
                "view_tag": "Mist view",
                "capacity": 2,
                "beds": 1,
                "base_price": 3900.00,
                "is_active": True
            },
            {
                "name": "The Duskline Room",
                "view_tag": "Ridge view",
                "capacity": 2,
                "beds": 1,
                "base_price": 4400.00,
                "is_active": True
            },
            {
                "name": "The Canopy Room",
                "view_tag": "Pine view",
                "capacity": 3,
                "beds": 1,
                "base_price": 5100.00,
                "is_active": True
            },
            {
                "name": "The Hollow Room",
                "view_tag": "Mist view",
                "capacity": 2,
                "beds": 1,
                "base_price": 3700.00,
                "is_active": True
            },
            {
                "name": "The Summit Room",
                "view_tag": "Ridge view",
                "capacity": 4,
                "beds": 2,
                "base_price": 7200.00,
                "is_active": True
            }
        ]

        # 3. Add them to the session and commit
        for room_data in rooms_to_create:
            new_room = Room(**room_data)
            db.add(new_room)
            
        db.commit()
        print("Success! 8 rooms have been added to the database.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database() 