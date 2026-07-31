from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.integrations.supabase import supabase

# FastAPI utility to extract the Bearer token from headers
security = HTTPBearer()

from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.admin import AdminProfile
# (Keep your existing get_current_user function here)



def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the Supabase JWT and returns the authenticated user."""
    token = credentials.credentials
    
    try:
        # Ask Supabase to validate the token
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

def get_current_admin(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Checks if the logged-in user is actually an approved Admin.
    If they are just a regular customer, it kicks them out with a 403 error.
    """
    admin_profile = db.query(AdminProfile).filter(AdminProfile.id == current_user.id).first()
    
    if not admin_profile or not admin_profile.is_approved:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: You do not have owner privileges to access this resource."
        )
    
    return admin_profile