import uuid
from decimal import Decimal

def generate_gcash_checkout(amount: Decimal, reference_id: str) -> dict:
    """
    Mock function to represent calling a payment gateway (e.g., PayMongo)
    to generate a GCash payment link.
    """
    # In production, this makes an HTTP request to your payment provider
    # using settings.GCASH_API_KEY
    
    mock_checkout_id = str(uuid.uuid4())
    return {
        "checkout_id": mock_checkout_id,
        "payment_url": f"https://mock-gateway.com/pay/{mock_checkout_id}",
        "reference": reference_id,
        "amount": float(amount),
        "status": "pending"
    }