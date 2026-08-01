# app/schemas/guest.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None