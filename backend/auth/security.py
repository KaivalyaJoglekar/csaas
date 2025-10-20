# backend/auth/security.py

import os
from dotenv import load_dotenv
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from jose.exceptions import JWTError
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Check if environment variables are loaded
if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_JWT_SECRET or not SUPABASE_SERVICE_ROLE_KEY:
    raise EnvironmentError("Critical Supabase ENV variables missing. Check backend/.env.")

# Initialize Clients
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    print(f"Supabase Client Initialization FAILED: {e}")

# Use HTTPBearer instead of OAuth2
security = HTTPBearer()

# --- HELPER FUNCTIONS ---

def get_user_role_from_db(user_id: str) -> str:
    """Queries the Supabase REST API to get the user's role."""
    try:
        # CORRECTED LINE: Use the admin client to bypass RLS for this trusted server-side check.
        response = supabase_admin.table('profiles').select('role').eq('id', user_id).single().execute()
        
        if response.data and 'role' in response.data:
            return response.data['role']
        return 'unknown' 
    except Exception as e:
        print(f"Error fetching user role for {user_id}: {e}")
        return 'unknown'

# --- CORE DEPENDENCIES ---

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validates JWT and fetches the user's current role from the database."""
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        print(f"Received token: {token[:20]}...")  # Debug log
        
        # Try decoding without audience first (Supabase tokens sometimes don't have audience)
        try:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        except JWTError:
            # If that fails, try without audience
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        
        print(f"Decoded payload: {payload}")  # Debug log
        
        user_id: str = payload.get("sub")
        if user_id is None:
            print("No user_id found in token payload")
            raise credentials_exception
            
    except JWTError as e:
        print(f"JWT decode error: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error in token validation: {e}")
        raise credentials_exception

    user_role = get_user_role_from_db(user_id)
    print(f"User {user_id} has role: {user_role}")  # Debug log

    if user_role == 'unknown':
        raise HTTPException(status_code=403, detail="User profile not found or access denied.")

    return {"id": user_id, "role": user_role, "token": token}

# 2. role_required (Uses get_current_user)
def role_required(*allowed_roles: str):
    def wrapper(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Operation forbidden. Required role: {allowed_roles}. Your role: {user['role']}",
            )
        return user
    return wrapper

# 3. Role Variables (MUST be defined last)
AdminRequired = role_required("admin")
SmeOrAuditorRequired = role_required("sme", "auditor")