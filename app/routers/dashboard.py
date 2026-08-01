from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.schemas.dashboard import DashboardMetricsOut
from app.services.dashboard_service import get_monthly_metrics
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetricsOut)
def read_dashboard_metrics(
    month: int = None, 
    year: int = None, 
    db: Session = Depends(get_db),
    user = Depends(get_current_user)  # Requires valid Supabase JWT
):
    """
    Returns the monthly revenue, total bookings, and occupancy rate. 
    Defaults to the current month and year if not specified.
    """
    # Default to current date if parameters aren't provided
    current_date = datetime.now()
    target_month = month or current_date.month
    target_year = year or current_date.year

    metrics = get_monthly_metrics(db, target_year, target_month)
    return metrics