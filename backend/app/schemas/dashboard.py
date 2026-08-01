from pydantic import BaseModel
from decimal import Decimal

class DashboardMetricsOut(BaseModel):
    monthly_revenue: Decimal
    total_bookings: int
    occupancy_rate: float
    month: int
    year: int

    class Config:
        from_attributes = True