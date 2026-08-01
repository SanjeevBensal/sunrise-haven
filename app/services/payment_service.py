from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.booking import Booking
from app.models.payment import Payment
from app.integrations.gcash import generate_gcash_checkout

def initialize_booking_payment(db: Session, booking_id: int):
    """Creates a payment intent and returns the GCash checkout URL."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="Booking is not in a payable state.")

    # Generate the GCash link
    gateway_response = generate_gcash_checkout(booking.total_amount, booking.booking_reference)
    
    # Save the payment attempt to the database
    payment_record = Payment(
        booking_id=booking.id,
        amount=booking.total_amount,
        payment_method="GCash",
        transaction_reference=gateway_response["checkout_id"],
        status="pending"
    )
    db.add(payment_record)
    db.commit()
    
    return gateway_response["payment_url"]

def process_payment_webhook(db: Session, transaction_reference: str, status: str):
    """Updates the database when the payment gateway sends a success/failure callback."""
    payment = db.query(Payment).filter(Payment.transaction_reference == transaction_reference).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")
    
    payment.status = status
    if status == "completed":
        # Automatically confirm the booking if payment is successful
        payment.booking.status = "confirmed"
        
    db.commit()
    return {"message": "Payment status updated successfully."}