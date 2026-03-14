import os
from fastapi import HTTPException
from supabase import create_client, Client

def get_supabase() -> Client:
    url: str = os.environ.get("SUPABASE_URL", "")
    key: str = os.environ.get("SUPABASE_KEY", "")
    
    if not url or not key:
        raise HTTPException(
            status_code=500, 
            detail="Missing Supabase Credentials. Please create a .env file with SUPABASE_URL and SUPABASE_KEY."
        )
        
    return create_client(url, key)
