import os
from dotenv import load_dotenv
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2
from jose import jwt
from jose.exceptions import JWTError
from supabase import create_client, Client

# Load environment variables from .env file. 
# This must be the first thing to run to ensure OS environment is set.
load_dotenv()

# --- CONFIGURATION ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Check if environment variables are loaded for security and client initialization
if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_JWT_SECRET:
    # Raise a runtime error to stop the server if critical environment variables are missing
    raise EnvironmentError(
        "Critical Supabase ENV variables (URL, ANON_KEY, JWT_SECRET) not set. "
        "Please check your backend/.env file."
    )

# Initialize the Supabase Client (used for data/role lookup and health check)
# This client uses the Anon Key and REST API.
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
except Exception as e:
    # Log initialization failure but allow the app to start to hit the health check
    print(f"Supabase Client Initialization FAILED. Check URL and ANON_KEY: {e}")
    # The health check in main.py will reflect this 'Disconnected' status

# --- JWT and OAuth2 Setup ---
# Fix for FastAPI TypeError: removed 'scopes' keyword argument
oauth2_scheme = OAuth2(scheme_name="Bearer") 

# --- Helper function for fetching user role from the profiles table (Supabase DB) ---
def get_user_role_from_db(user_id: str) -> str:
    """Queries the Supabase REST API to get the user's role using the anon key."""
    try:
        # The query uses the Supabase Python client (which calls PostgREST)
        response = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
        
        # PostgREST response object has data property
        if response.data and 'role' in response.data:
            return response.data['role']
        
        # If the profile doesn't exist (e.g., deleted), treat as unknown
        return 'unknown' 
        
    except Exception as e:
        print(f"Error fetching role for user {user_id}: {e}")
        # If any error (connection, RLS issue, etc.), treat as unknown
        return 'unknown'

# Custom Dependency to get the current user and their role
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validates JWT and fetches the user's current role from the database."""
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. Decode and Verify the JWT using the shared JWT Secret
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            audience="authenticated"
        )
        
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # 2. Fetch the current role from the Supabase Database (REST API)
    user_role = get_user_role_from_db(user_id)

    if user_role == 'unknown':
        # This handles cases where the JWT is valid, but the user profile is missing
        raise HTTPException(status_code=403, detail="User profile not found or access denied.")

    # Return the verified user data
    return {"id": user_id, "role": user_role, "token": token}

# Role-Based Access Control Dependency Factory
def role_required(*allowed_roles: str):
    def wrapper(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Operation forbidden. Required role: {allowed_roles}. Your role: {user['role']}",
            )
        return user
    return wrapper

# Specific Role Dependencies
AdminRequired = role_required("admin")
SmeOrAuditorRequired = role_required("sme", "auditor")