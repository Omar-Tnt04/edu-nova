import os
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.models.user import UserSignup, UserLogin, UserVerify
from app.db.supabase import get_supabase

router = APIRouter()

@router.post("/signup")
async def signup(user_data: UserSignup):
    supabase: Client = get_supabase()
    
    # Sign up via Supabase Auth
    try:
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })
        return {"status": "success", "user": response.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(user_data: UserLogin):
    supabase: Client = get_supabase()
    
    # Login via Supabase Auth
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        return {
            "status": "success", 
            "access_token": response.session.access_token,
            "user": response.user
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

@router.post("/verify")
async def verify_otp(user_data: UserVerify):
    supabase: Client = get_supabase()
    try:
        response = supabase.auth.verify_otp({
            "email": user_data.email,
            "token": user_data.code,
            "type": "signup"
        })
        return {
            "status": "success",
            "access_token": response.session.access_token,
            "user": response.user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

@router.get("/google")
async def google_auth():
    supabase: Client = get_supabase()
    try:
        response = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {
                "redirect_to": "http://localhost:3000/dashboard"
            }
        })
        return {"url": response.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
