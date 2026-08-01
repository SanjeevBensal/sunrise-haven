from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.payment_service import initialize_booking_payment, process_payment_webhook
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/{booking_id}/checkout")
def get_checkout_url(
    booking_id: int, 
    db: Session = Depends(get_db),
    user=Depends(get_current_user) # Protect this endpoint: Requires Supabase Login
):
    """Generates the GCash payment link for a specific booking."""
    url = initialize_booking_payment(db, booking_id)
    return {"checkout_url": url}

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives automated updates from the payment gateway (no auth required)."""
    payload = await request.json()
    transaction_ref = payload.get("data", {}).get("attributes", {}).get("reference_number")
    status = payload.get("data", {}).get("attributes", {}).get("status")
    
    if not transaction_ref or not status:
        return {"message": "Invalid webhook payload"}
        
    return process_payment_webhook(db, transaction_ref, status)