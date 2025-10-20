from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth.security import AdminRequired, SmeOrAuditorRequired, get_current_user, supabase # Import the client
import time

app = FastAPI(
    title="CSaaS Platform API",
    description="Python FastAPI backend for CSaaS platform.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models (unchanged) ---
class DashboardSummary(BaseModel):
    threat_count: int
    compliance_score: int
    pending_vendor_assessments: int
    user_role_focus: str

class DashboardResponse(BaseModel):
    user_id: str
    user_role: str
    summary: DashboardSummary

# --- Module 1: Health Check ---
@app.get("/api/health")
def health_check():
    # You can also check the DB connection here
    try:
        # Perform a quick, unauthenticated check on a public table (e.g., profiles count)
        supabase.table('profiles').select('id', count='exact').limit(1).execute()
        db_status = "Connected"
    except Exception:
        db_status = "Disconnected"
        
    return {"status": "ok", "db_status": db_status, "timestamp": time.time()}

# --- Module 2: Main Dashboard (Protected) ---
@app.get("/api/dashboard/summary", response_model=DashboardResponse)
async def get_dashboard_summary(user: dict = Depends(SmeOrAuditorRequired)):
    """
    Aggregation endpoint. User role is guaranteed to be 'sme' or 'auditor'.
    """
    
    # REAL IMPLEMENTATION: 
    # Use the Supabase client here to perform complex, multi-table queries 
    # to generate the summary data for the dashboard.
    # E.g.: supabase.rpc('get_user_dashboard_metrics', {'user_id': user['id']}).execute()
    
    if user["role"] == "auditor":
        data = DashboardSummary(
            threat_count=0,
            compliance_score=92,
            pending_vendor_assessments=12,
            user_role_focus="Auditor: Review Focus"
        )
    else: # SME role
        data = DashboardSummary(
            threat_count=5,
            compliance_score=85,
            pending_vendor_assessments=3,
            user_role_focus="SME: Management Focus"
        )

    return DashboardResponse(
        user_id=user["id"],
        user_role=user["role"],
        summary=data
    )

# --- Example Admin Endpoint ---
@app.get("/api/admin/settings")
async def get_admin_settings(user: dict = Depends(AdminRequired)):
    """Only a System Admin can access this endpoint."""
    return {
        "user_id": user["id"],
        "user_role": user["role"],
        "message": "System-wide configuration settings retrieved."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)