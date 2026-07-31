from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.schemas.guest import UserLogin, UserSignUp
from app.integrations.supabase import supabase
from app.database.database import get_db
from app.models.admin import AdminProfile
from app.middleware.auth import get_current_user
from app.utils.limiter import limiter 
from app.middleware.logger import logger # <--- Import the logger!

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup")
@limiter.limit("3/minute")
def sign_up(request: Request, user: UserSignUp, db: Session = Depends(get_db)):
    try:
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {"full_name": user.full_name}
            }
        })
        
        if not response.user:
            logger.warning(f"Failed signup attempt for email: {user.email}")
            raise HTTPException(status_code=400, detail="Signup failed.")

        new_admin = AdminProfile(
            id=response.user.id,
            email=user.email,
            full_name=user.full_name,
            is_approved=False 
        )
        db.add(new_admin)
        db.commit()

        logger.info(f"New admin signup request submitted for: {user.email}")
        return {"message": "Sign-up request sent to administrators for approval."}
    except Exception as e:
        logger.error(f"Error during signup for {user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
@limiter.limit("5/minute") 
def log_in(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not response.user:
            logger.warning(f"Failed login attempt: {user.email} (Invalid credentials)")
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        admin_profile = db.query(AdminProfile).filter(AdminProfile.id == response.user.id).first()
        
        if not admin_profile or not admin_profile.is_approved:
            supabase.auth.sign_out()
            logger.warning(f"Failed login attempt: {user.email} (Account pending approval)")
            raise HTTPException(
                status_code=403, 
                detail="Your account is pending administrator approval."
            )

        logger.info(f"Successful login: {user.email}")
        return {
            "message": "Login successful", 
            "access_token": response.session.access_token,
            "user": response.user
        }
    except HTTPException as http_e:
        raise http_e
    except Exception:
        logger.warning(f"Failed login attempt: {user.email} (Unknown error/Invalid credentials)")
        raise HTTPException(status_code=401, detail="Invalid email or password.")


# --- ADMIN DASHBOARD ENDPOINTS ---
@router.get("/requests")
def get_pending_requests(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(AdminProfile).filter(AdminProfile.is_approved == False).all()

@router.post("/requests/{admin_id}/approve")
def approve_admin(admin_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    admin_profile = db.query(AdminProfile).filter(AdminProfile.id == admin_id).first()
    if not admin_profile:
        logger.warning(f"Admin action failed: Attempted to approve non-existent ID {admin_id}")
        raise HTTPException(status_code=404, detail="Admin request not found.")
    
    admin_profile.is_approved = True
    db.commit()
    
    # Log the successful admin action
    logger.info(f"Admin action: Account '{admin_profile.email}' was approved by system/admin.")
    return {"message": f"Admin {admin_profile.email} has been approved."}