from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
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
    compliance_score: float
    pending_vendor_assessments: int
    user_role_focus: str

class DashboardResponse(BaseModel):
    user_id: str
    user_role: str
    summary: DashboardSummary

class RoleUpdate(BaseModel):
    user_id: str
    role: str

# NEW MODEL for profile creation
class ProfileCreate(BaseModel):
    user_id: str
    email: str
    role: str = "sme"

# NEW MODELS for feature implementation
class ReportRequest(BaseModel):
    report_type: str
    user_id: str

class ScanRequest(BaseModel):
    target: str

app = FastAPI(
    title="CSaaS Platform API",
    description="Python FastAPI backend for CSaaS platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    # Allow common Vite dev origins (5173 default). Include ports 5174 and 5175 which Vite may select.
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
    ],
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
        # CORRECTED LINE: Use the admin client to bypass RLS for this trusted server-side check.
        response = supabase_admin.table('profiles').select('role').eq('id', user_id).single().execute()
        
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
        supabase.table('profiles').select('id', count='exact').limit(1).execute()
        db_status = "Connected"
    except Exception:
        db_status = "Disconnected"
        
    return {"status": "ok", "db_status": db_status, "timestamp": time.time()}

# NEW ENDPOINT for creating user profiles
@app.post("/api/auth/create-profile")
async def create_user_profile(profile: ProfileCreate):
    """
    Creates a user profile if it doesn't exist.
    """
    try:
        # Check if profile already exists
        existing_profile = supabase_admin.table('profiles').select('id').eq('id', profile.user_id).execute()
        
        if existing_profile.data and len(existing_profile.data) > 0:
            # Profile already exists, return it
            return {"message": "Profile already exists", "profile": existing_profile.data[0]}
        
        # Create new profile
        response = supabase_admin.table('profiles').insert({
            'id': profile.user_id,
            'email': profile.email,
            'role': profile.role
        }).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create user profile.")
        
        return {"message": "Profile created successfully", "profile": response.data[0]}
        
    except Exception as e:
        print(f"Error creating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user profile.")

@app.post("/api/admin/set-user-role")
async def set_user_role(update: RoleUpdate):
    """
    Updates a user's role in the profiles table using the Service Role Key.
    """
    if update.role not in ['sme', 'auditor']:
         raise HTTPException(status_code=400, detail="Invalid role specified.")

    try:
        response = supabase_admin.table('profiles').update({'role': update.role}).eq('id', update.user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User profile not found after registration.")

        return {"message": f"User role set to {update.role}"}

    except Exception as e:
        print(f"Error updating user role with admin client: {e}")
        raise HTTPException(status_code=500, detail="Failed to set user role in database.")

# --- PROTECTED ENDPOINTS ---
@app.get("/api/dashboard/summary", response_model=DashboardResponse)
async def get_dashboard_summary(user: dict = Depends(SmeOrAuditorRequired)):
    """
    (IMPLEMENTED) Fetches real data for the dashboard summary based on user role.
    """
    user_id = user["id"]
    user_role = user["role"]
    
    try:
        # 1. Get open incident tickets (threat_count)
        threat_count_res = supabase_admin.table('incident_tickets').select('id', count='exact').eq('status', 'Open').execute()
        threat_count = threat_count_res.count if threat_count_res.count is not None else 0

        # 2. Get pending vendor assessments
        pending_assessments_res = supabase_admin.table('vendor_assessments').select('id', count='exact').eq('status', 'Pending Review').execute()
        pending_vendor_assessments = pending_assessments_res.count if pending_assessments_res.count is not None else 0
        
        # 3. Calculate Compliance Score (example logic)
        total_assessments_res = supabase_admin.table('vendor_assessments').select('id', count='exact').in_('status', ['Approved', 'Rejected']).execute()
        approved_assessments_res = supabase_admin.table('vendor_assessments').select('id', count='exact').eq('status', 'Approved').execute()
        total = total_assessments_res.count if total_assessments_res.count is not None else 0
        approved = approved_assessments_res.count if approved_assessments_res.count is not None else 0
        compliance_score = (approved / total * 100) if total > 0 else 100.0

        # 4. Role-specific focus text
        user_role_focus = "Auditor: Review vendor submissions and compliance reports." if user_role == "auditor" else "SME: Manage vendor assessments and remediate open incidents."

        summary = DashboardSummary(
            threat_count=threat_count,
            compliance_score=round(compliance_score, 2),
            pending_vendor_assessments=pending_vendor_assessments,
            user_role_focus=user_role_focus
        )

        return DashboardResponse(
            user_id=user_id,
            user_role=user_role,
            summary=summary
        )

    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard metrics.")

# --- NEW ENDPOINTS (from diagrams) ---
@app.post("/api/reports/generate")
async def generate_report(req: ReportRequest, user: dict = Depends(SmeOrAuditorRequired)):
    """
    (IMPLEMENTED) Creates a record in the 'reports' table to simulate report generation.
    """
    try:
        response = supabase.table('reports').insert({
            'user_id': user["id"],
            'report_type': req.report_type,
            'file_storage_path': f"reports/{req.report_type.replace(' ', '_')}_{user['id']}_{int(time.time())}.pdf"
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create report record.")

        return {"message": f"'{req.report_type}' report generated successfully.", "data": response.data[0]}

    except Exception as e:
        print(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during report generation.")


@app.get("/api/admin/users")
async def list_users(user: dict = Depends(AdminRequired)):
    """
    Returns a list of users with basic profile info (id, email, role) — admin only.
    """
    try:
        response = supabase_admin.table('profiles').select('id, email, role').execute()
        return response.data or []
    except Exception as e:
        print(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Failed to list users.")


@app.get("/api/vendors")
async def list_vendors(user: dict = Depends(SmeOrAuditorRequired)):
    """List all vendors (SME/Auditor)."""
    try:
        res = supabase.table('vendors').select('*').execute()
        return res.data or []
    except Exception as e:
        print(f"Error fetching vendors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vendors.")


@app.post("/api/vendors")
async def create_vendor(payload: dict, user: dict = Depends(SmeOrAuditorRequired)):
    try:
        res = supabase.table('vendors').insert({
            'name': payload.get('name'),
            'description': payload.get('description'),
            'contact_email': payload.get('contact_email'),
            'created_by': user['id']
        }).execute()
        return res.data[0]
    except Exception as e:
        print(f"Error creating vendor: {e}")
        raise HTTPException(status_code=500, detail="Failed to create vendor.")


@app.get("/api/vendors/{vendor_id}")
async def get_vendor(vendor_id: str, user: dict = Depends(SmeOrAuditorRequired)):
    try:
        res = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Vendor not found.")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting vendor: {e}")
        raise HTTPException(status_code=500, detail="Failed to get vendor.")


@app.put("/api/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, payload: dict, user: dict = Depends(SmeOrAuditorRequired)):
    try:
        res = supabase.table('vendors').update({
            'name': payload.get('name'),
            'description': payload.get('description'),
            'contact_email': payload.get('contact_email')
        }).eq('id', vendor_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Vendor not found or update failed.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating vendor: {e}")
        raise HTTPException(status_code=500, detail="Failed to update vendor.")


@app.post("/api/vendors/{vendor_id}/evidence")
async def upload_vendor_evidence(vendor_id: str, file: UploadFile = File(...), user: dict = Depends(SmeOrAuditorRequired)):
    """
    Accepts a multipart file and uploads it to Supabase Storage under 'evidence/{vendor_id}/...'
    """
    try:
        contents = await file.read()
        filename = f"evidence/{vendor_id}/{int(time.time())}_{file.filename}"
        # Ensure the bucket exists named 'vendor-evidence' (assumption)
        upload_res = supabase_admin.storage.from_('vendor-evidence').upload(filename, contents, {'content-type': file.content_type})
        # Record metadata in a table
        record = supabase.table('vendor_evidence').insert({
            'vendor_id': vendor_id,
            'uploaded_by': user['id'],
            'file_path': filename,
            'file_name': file.filename
        }).execute()
        return { 'message': 'Uploaded', 'path': filename }
    except Exception as e:
        print(f"Error uploading evidence: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload evidence.")

@app.post("/api/scans/initiate")
async def initiate_scan(req: ScanRequest, user: dict = Depends(AdminRequired)):
    """
    (IMPLEMENTED) Simulates a scan, creating a scan_result and a corresponding threat.
    """
    try:
        # 1. Simulate scan result
        scan_result_res = supabase.table('scan_results').insert({
            'target': req.target,
            'risk_score': 7.8,
            'details_json': {'vulnerability': 'SQL Injection', 'port': 80},
            'run_by_id': user['id']
        }).execute()
        
        if not scan_result_res.data:
            raise HTTPException(500, "Failed to create scan result.")
        
        scan_result_id = scan_result_res.data[0]['id']

        # 2. Correlate and create a Threat
        threat_res = supabase.table('threats').insert({
            'scan_result_id': scan_result_id,
            'risk_score': 7.8,
            'risk_level': 'High',
            'description': f"High risk SQLi vulnerability discovered on {req.target}"
        }).execute()

        if not threat_res.data:
            raise HTTPException(500, "Failed to create threat from scan.")
        
        threat_id = threat_res.data[0]['id']

        # 3. Create an Incident Ticket
        incident_res = supabase.table('incident_tickets').insert({
            'threat_id': threat_id,
            'status': 'Open',
            'remediation_notes': 'Acknowledge and apply patch immediately.'
        }).execute()
        
        if not incident_res.data:
            raise HTTPException(500, "Failed to create incident ticket.")

        return {
            "message": "Scan simulation successful. Scan result, threat, and incident ticket created.",
            "scan_id": scan_result_id,
            "threat_id": threat_id,
            "incident_id": incident_res.data[0]['id']
        }

    except Exception as e:
        print(f"Error in scan simulation: {e}")
        raise HTTPException(status_code=500, detail="Failed to simulate security scan.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)