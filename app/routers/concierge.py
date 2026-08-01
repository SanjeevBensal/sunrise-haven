from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.concierge import ChatRequest, ChatResponse
from app.services.concierge_engine import process_concierge_chat
from app.utils.limiter import limiter

router = APIRouter(prefix="/concierge", tags=["AI Concierge"])

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("15/minute")
def concierge_chat(request: Request, payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Public Endpoint: Virtual Concierge conversational interface.
    """
    result = process_concierge_chat(db, payload.message, payload.history)
    return result