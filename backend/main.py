from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth.security import SmeOrAuditorRequired, AdminRequired, supabase_admin, supabase
import os
import fitz  # PyMuPDF
import google.generativeai as genai  # Google Gemini library
import json


# -------------------- Pydantic Models --------------------
class DashboardSummary(BaseModel):
    threat_count: int
    pending_vendor_assessments: int


class DashboardResponse(BaseModel):
    user_id: str
    user_role: str
    summary: DashboardSummary


class RoleUpdate(BaseModel):
    user_id: str
    role: str


class ProfileCreate(BaseModel):
    user_id: str
    email: str
    role: str = "sme"


class ReportRequest(BaseModel):
    report_type: str


class ScanRequest(BaseModel):
    target: str


# -------------------- App Initialization --------------------
app = FastAPI(
    title="CSaaS Platform API",
    description="Python FastAPI backend for CSaaS platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- Health Check --------------------
@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# -------------------- Auth & Profile --------------------
@app.post("/api/auth/create-profile")
async def create_user_profile(profile: ProfileCreate):
    res = supabase_admin.table('profiles').select('id').eq('id', profile.user_id).execute()
    if res.data:
        return {"message": "Profile already exists"}

    supabase_admin.table('profiles').insert({
        'id': profile.user_id,
        'email': profile.email,
        'role': profile.role
    }).execute()
    return {"message": "Profile created successfully"}


@app.post("/api/admin/set-user-role")
async def set_user_role(update: RoleUpdate, user: dict = Depends(AdminRequired)):
    if update.role not in ['sme', 'auditor', 'admin']:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    supabase_admin.table('profiles').update({'role': update.role}).eq('id', update.user_id).execute()
    return {"message": f"User role set to {update.role}"}


# -------------------- Dashboard Summary --------------------
@app.get("/api/dashboard/summary", response_model=DashboardResponse)
async def get_dashboard_summary(user: dict = Depends(SmeOrAuditorRequired)):
    threats = supabase_admin.table('incident_tickets').select('id', count='exact').eq('status', 'Open').execute()
    vendors = supabase_admin.table('vendor_assessments').select('id', count='exact').eq('status', 'Pending Review').execute()

    summary = DashboardSummary(
        threat_count=threats.count or 0,
        pending_vendor_assessments=vendors.count or 0
    )
    return DashboardResponse(user_id=user["id"], user_role=user["role"], summary=summary)


# -------------------- Scans --------------------
@app.post("/api/scans/initiate")
async def initiate_scan(req: ScanRequest, user: dict = Depends(SmeOrAuditorRequired)):
    scan_res = supabase.table('scan_results').insert({'target': req.target, 'run_by_id': user['id']}).execute()
    scan_id = scan_res.data[0]['id']

    threat_res = supabase.table('threats').insert({
        'scan_result_id': scan_id,
        'risk_score': 8.1,
        'risk_level': 'High'
    }).execute()
    threat_id = threat_res.data[0]['id']

    incident_res = supabase.table('incident_tickets').insert({
        'threat_id': threat_id,
        'status': 'Open'
    }).execute()

    return {"scan_id": scan_id, "incident_id": incident_res.data[0]['id']}


# -------------------- Vendors --------------------
@app.get("/api/vendors")
async def list_vendors(user: dict = Depends(SmeOrAuditorRequired)):
    res = supabase.table('vendors').select('*').execute()
    return res.data or []


@app.post("/api/vendors")
async def create_vendor(payload: dict, user: dict = Depends(SmeOrAuditorRequired)):
    res = supabase.table('vendors').insert({
        'name': payload.get('name'),
        'description': payload.get('description'),
        'contact_email': payload.get('contact_email'),
        'owner_id': user['id']
    }).execute()
    return res.data[0]


@app.get("/api/vendors/{vendor_id}")
async def get_vendor(vendor_id: str, user: dict = Depends(SmeOrAuditorRequired)):
    res = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return res.data


# -------------------- Malicious Content Analysis --------------------
@app.post("/api/reports/analyze-content")
async def analyze_content(user: dict = Depends(SmeOrAuditorRequired), file: UploadFile = File(...)):
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured on the server.")

    try:
        genai.configure(api_key=gemini_api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure Gemini API: {e}")

    file_content = await file.read()
    text_to_analyze = ""

    if file.content_type == "application/pdf":
        try:
            with fitz.open(stream=file_content, filetype="pdf") as doc:
                for page in doc:
                    text_to_analyze += page.get_text()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process PDF file: {e}")

    elif file.content_type == "text/plain":
        text_to_analyze = file_content.decode('utf-8')
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a .txt or .pdf file.")

    if not text_to_analyze.strip():
        raise HTTPException(status_code=400, detail="The uploaded file is empty or contains no readable text.")

    prompt = f"""
    Analyze the following text for malicious content like phishing, scams, social engineering, or malware indicators.
    Provide your analysis in JSON format with:
    - "summary": A brief one-sentence overview.
    - "risk_level": One of "Safe", "Low", "Medium", "High", "Critical".
    - "findings": List of {{"description", "type"}} objects. Empty list if none.
    
    Text:
    ---
    {text_to_analyze[:8000]}
    ---
    """

    try:
        # Use the 2.5 "flash" variant for lower-latency inference as requested
        model = genai.GenerativeModel('gemini-2.0-flash')
        generation_config = genai.types.GenerationConfig(response_mime_type="application/json")

        response = model.generate_content(prompt, generation_config=generation_config)
        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during AI analysis: {e}")
