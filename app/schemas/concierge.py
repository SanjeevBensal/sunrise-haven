from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: Optional[List[ChatMessage]] = []

class SuggestionChip(BaseModel):
    label: str
    action: str

class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []
    room_cards: Optional[List[Dict[str, Any]]] = None
    escalate_to_owner: bool = False