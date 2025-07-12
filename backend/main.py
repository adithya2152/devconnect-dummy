from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from email_utils import send_otp_email  # Ensure this module is correctly implemented
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os
from dotenv import load_dotenv
from fastapi import UploadFile, File, Form
from typing import Optional
from fastapi import Depends
from auth.auth import verify_token
from chat.chat_routes import chat_app
from search.searchRoute import search_app
from chat_ws import ws_router
from db import get_projects_with_members
from db import get_projects_with_members, insert_app_project, insert_app_project_member
from notification import notifrouter
from community.community_routes import community_app








load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

supabase = create_client(
    supabase_url,
    supabase_key
)

app.mount("/chat", chat_app)
app.mount("/search", search_app)
app.mount("/communities", community_app)
app.include_router(ws_router)

app.include_router(notifrouter)


# Temporary storage (replace with database in production)
otp_storage = {}


class EmailRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

@app.post("/send-otp")
async def send_otp(request: EmailRequest):
    otp = send_otp_email(request.email)
    if not otp:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    
    # Store OTP with email (in production, use database with expiration)
    otp_storage[request.email] = otp
    
    return {
        "status": 200,
        "message": "OTP sent successfully",
        # Remove "otp" in production - only for demo
    }

@app.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    stored_otp = otp_storage.get(request.email)
    
    if not stored_otp:
        raise HTTPException(
            status_code=400,
            detail="No OTP found for this email. Request a new one."
        )
    
    if request.otp != stored_otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )
    
    # Clear OTP after successful verification
    del otp_storage[request.email]
    
    return {
        "success": True,
        "message": "OTP verified successfully"
    }



class UserRegister(BaseModel):
    email: str
    password: str

@app.post("/register")
async def register(
    email: str = Form(...),
    password: str = Form(...),
    username: str = Form(None),  # Optional field
):
    try:
        # Register user with Supabase
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "username": username,  # Add additional user metadata here
                }
            }
        })

        # Check if registration was successful
        if hasattr(auth_response, 'user') and auth_response.user:
            print("User registered successfully:", auth_response.user)
            print("auth Response:", auth_response.session)

            # insert user into profiles table
            user_data = {
                "id": auth_response.user.id,    
                "email": auth_response.user.email,
                "username": auth_response.user.user_metadata.get("username", username),
                "full_name": auth_response.user.user_metadata.get("username", username),  
            }
            supabase.table("profiles").insert(user_data).execute()
            print("User data inserted into profiles table:", user_data)

            # Check if session exists before accessing tokens
            if hasattr(auth_response, 'session') and auth_response.session is not None:
                return {
                    "status": "success",
                    "access_token": auth_response.session.access_token ,
                    "refresh_token": auth_response.session.refresh_token,
                    "user": {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "username": auth_response.user.user_metadata.get("username")
                    }
                }
            else:
                raise HTTPException(status_code=400, detail="No session returned from Supabase. Registration may have failed.")
        else:
            # Check for error message (Supabase v2 structure)
            error_message = getattr(auth_response, 'message', None) or "Registration failed"
            raise HTTPException(status_code=400, detail=error_message)

    except Exception as e:
        # Handle specific Supabase errors if needed
        error_detail = str(e)
        if "User already registered" in error_detail:
            error_detail = "This email is already registered"
        raise HTTPException(status_code=400, detail=error_detail)
    
@app.post("/login")
async def login(request: UserRegister):
    try:
        # Authenticate user with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password":request.password
        })
        # Check if login was successful
        if hasattr(auth_response, 'user') and auth_response.user:
            #insert ot profiles table 

            # Check if session exists before accessing tokens
            if hasattr(auth_response, 'session') and auth_response.session is not None:
                return {
                    "status": "success",
                    "user_id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token,
                    "user": {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "username": auth_response.user.user_metadata.get("username")
                    },
                    # Include any other relevant user data
                }
            else:
                raise HTTPException(status_code=400, detail="No session returned from Supabase. Login may have failed.")
        else:
            # Check for error message (Supabase v2 structure)
            error_message = getattr(auth_response, 'message', None) or "Login failed"
            raise HTTPException(status_code=400, detail=error_message)
    except Exception as e:
        # Handle specific Supabase errors if needed
        error_detail = str(e)
        if "Invalid login credentials" in error_detail:
            error_detail = "Invalid email or password"
        raise HTTPException(status_code=400, detail=error_detail)
    
@app.post("/logout")
async def logout():
    try:
        # Sign out user from Supabase
        supabase.auth.sign_out()
        return {"status": "success", "message": "User logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Logout failed")

@app.get("/api/protected")
async def protected(payload: dict = Depends(verify_token)):
   
    return {
        "status": "success",
        "user_id": payload["sub"],
        "email": payload["email"]
    }

@app.get("/api/app_projects_with_members")
async def api_get_projects_with_members(payload: dict = Depends(verify_token)):
    data = await get_projects_with_members()
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch projects with members")
    return {"projects": data}

from fastapi import Request

class AppProjectCreate(BaseModel):
    title: str
    description: str
    detailed_description: Optional[str] = None
    status: Optional[str] = 'active'
    project_type: Optional[str] = None
    domain: Optional[str] = None
    difficulty_level: Optional[str] = 'intermediate'
    required_skills: Optional[list[str]] = None
    tech_stack: Optional[list[str]] = None
    programming_languages: Optional[list[str]] = None
    estimated_duration: Optional[str] = None
    team_size_min: Optional[int] = 1
    team_size_max: Optional[int] = 5
    is_remote: Optional[bool] = True
    timezone_preference: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    figma_url: Optional[str] = None
    documentation_url: Optional[str] = None
    image_url: Optional[str] = None
    is_recruiting: Optional[bool] = True
    is_public: Optional[bool] = True
    collaboration_type: Optional[str] = 'open'
    created_by: Optional[str] = None  # Will be set automatically from authenticated user
    tags: Optional[list[str]] = None
    deadline: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class AppProjectMemberCreate(BaseModel):
    project_id: str
    user_id: Optional[str] = None  # Will be set automatically from authenticated user
    role: Optional[str] = 'member'
    status: Optional[str] = 'pending'
    contribution_description: Optional[str] = None

@app.post("/api/app_projects")
async def create_app_project(project: AppProjectCreate, payload: dict = Depends(verify_token)):
    project_data = project.dict()
    # Set the created_by field to the authenticated user's ID
    project_data['created_by'] = payload["sub"]
    created = insert_app_project(project_data)
    if created:
        return {"status": "success", "project": created}
    else:
        raise HTTPException(status_code=500, detail="Failed to create project")

@app.post("/api/app_project_members")
async def create_app_project_member(member: AppProjectMemberCreate, payload: dict = Depends(verify_token)):
    member_data = member.dict()
    member_data['status'] = 'pending'  # Always set to pending
    # Set the user_id field to the authenticated user's ID
    member_data['user_id'] = payload["sub"]
    created = insert_app_project_member(member_data)
    if created:
        return {"status": "success", "member": created}
    else:
        raise HTTPException(status_code=500, detail="Failed to apply to join project")
