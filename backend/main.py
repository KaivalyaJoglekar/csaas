from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from auth.security import SmeOrAuditorRequired, AdminRequired, supabase_admin, supabase
from jose import jwt
from jose.exceptions import JWTError
import os
import time
import httpx # Required for API calls to external scanner/OpenVAS

# --- Pydantic Models ---
class DashboardSummary(BaseModel):
    threat_count: int
    compliance_score: int
    pending_vendor_assessments: int
    user_role_focus: str

class DashboardResponse(BaseModel):
    user_id: str
    user_role: str
    summary: DashboardSummary

class RoleUpdate(BaseModel): # NEW MODEL
    user_id: str
    role: str

app = FastAPI(
    title="CSaaS Platform API",
    description="Python FastAPI backend for CSaaS platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize security
security = HTTPBearer()

# --- HELPER FUNCTIONS ---
def get_user_role_from_db(user_id: str) -> str:
    """Helper function to get user role from database"""
    try:
        response = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
        if response.data and 'role' in response.data:
            return response.data['role']
        return 'unknown' 
    except Exception as e:
        print(f"Error fetching user role for {user_id}: {e}")
        return 'unknown'

# --- UNPROTECTED ENDPOINTS ---
@app.get("/api/health")
def health_check():
    try:
        # Check connection using the Anon Key client (from auth/security.py)
        supabase.table('profiles').select('id', count='exact').limit(1).execute()
        db_status = "Connected"
    except Exception:
        db_status = "Disconnected"
        
    return {"status": "ok", "db_status": db_status, "timestamp": time.time()}

# NEW ENDPOINT: Called by registration form to set initial role (Uses Service Role Key)
@app.post("/api/admin/set-user-role")
async def set_user_role(update: RoleUpdate):
    """
    Updates a user's role in the profiles table using the Service Role Key.
    """
    if update.role not in ['sme', 'auditor']:
         raise HTTPException(status_code=400, detail="Invalid role specified.")

    try:
        # Use the ADMIN client to UPDATE the profile table (bypasses RLS)
        response = supabase_admin.table('profiles').update({'role': update.role}).eq('id', update.user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User profile not found after registration.")

        return {"message": f"User role set to {update.role}"}

    except Exception as e:
        print(f"Error updating user role with admin client: {e}")
        raise HTTPException(status_code=500, detail="Failed to set user role in database.")

# DEBUG ENDPOINT: Test JWT token validation
@app.get("/api/debug/token")
async def debug_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Debug endpoint to test JWT validation"""
    try:
        token = credentials.credentials
        print(f"Debug endpoint received token: {token[:20]}...")
        
        SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
        
        if not SUPABASE_JWT_SECRET:
            return {
                "status": "error",
                "error": "SUPABASE_JWT_SECRET not found in environment variables",
                "message": "Environment configuration error"
            }
        
        # Try with audience first
        try:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            print("Token decoded with audience successfully")
        except JWTError:
            # Try without audience
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
            print("Token decoded without audience successfully")
        
        user_id = payload.get("sub")
        user_role = get_user_role_from_db(user_id)
        
        return {
            "status": "success",
            "user_id": user_id,
            "user_role": user_role,
            "payload": payload,
            "message": "Token is valid"
        }
    except JWTError as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Token validation failed"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Unexpected error"
        }

# --- PROTECTED ENDPOINTS (Module 2) ---
@app.get("/api/dashboard/summary", response_model=DashboardResponse)
async def get_dashboard_summary(user: dict = Depends(SmeOrAuditorRequired)):
    
    # Placeholder Logic: In a real app, query Supabase for metrics here
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

# --- EXAMPLE ENDPOINT (Module 3/4 Placeholder) ---
@app.post("/api/scans/initiate")
async def initiate_scan(user: dict = Depends(AdminRequired)): # Only Admin can initiate in this example
    # Example logic for integrating with OpenVAS or a mock scanner
    # scanner_api_key = os.getenv("OPENAVAS_API_KEY") 
    # async with httpx.AsyncClient() as client:
    #     response = await client.post("https://openvas.api/scan", headers={"Authorization": f"Token {scanner_api_key}"})
    #     # ... logic to parse and write to scan_results table ...
        
    return {"message": "Scan initiation successful."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)