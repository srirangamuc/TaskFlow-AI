import json
from fastapi import Depends, FastAPI, Header, Response
from sqlalchemy import select
from starlette.requests import Request
from fastapi.responses import JSONResponse, RedirectResponse
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google_auth_oauthlib.flow
import os
import logging
import sys
import traceback
from typing import Dict
from datetime import datetime
from models import User,Task
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Allow insecure transport for local testing (REMOVE IN PRODUCTION)
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CLIENT_SECRETS_FILE = "credentials.json"
SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]
STATE_STORAGE: Dict[str, str] = {}  # Temporary storage, replace with Redis or DB

# Simple function to print logs directly to console
def log(message, level="INFO"):
    print(f"[{level}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {message}", flush=True)

@app.get("/")
def root():
    """Root endpoint to test logging"""
    log("Root endpoint accessed", "DEBUG")
    return {"message": "Check your console for logs"}

@app.get("/auth/login")
def auth_with_google():
    """Redirect user to Google's OAuth Page"""
    try:
        log("Starting auth_with_google function", "DEBUG")
        
        # Check if credentials file exists
        if not os.path.exists(CLIENT_SECRETS_FILE):
            log(f"Credentials file not found: {CLIENT_SECRETS_FILE}", "ERROR")
            return JSONResponse(status_code=500, content={"detail": f"Credentials file not found: {CLIENT_SECRETS_FILE}"})
        
        # Print the directory contents for debugging
        log(f"Current directory: {os.getcwd()}", "DEBUG")
        log(f"Files in directory: {os.listdir('.')}", "DEBUG")
        
        flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE, SCOPES
        )
        log("Flow created successfully", "DEBUG")
        
        flow.redirect_uri = "http://localhost:8000/auth/callback"
        authorization_url, state = flow.authorization_url(access_type="offline", prompt="consent")
        
        STATE_STORAGE[state] = "pending"  # Store state securely
        log(f"OAuth state stored: {state}", "DEBUG")
        log(f"Redirecting to: {authorization_url}", "DEBUG")
        
        return RedirectResponse(authorization_url)
    except Exception as e:
        error_trace = traceback.format_exc()
        log(f"Error in auth_with_google: {e}\n{error_trace}", "ERROR")
        return JSONResponse(status_code=500, content={"detail": f"Google Auth Error: {str(e)}"})

async def get_user_by_google_id(db: AsyncSession, google_id: str):
    async with db.begin():  # Ensures proper async transaction handling
        query = select(User).where(User.google_id == google_id)
        result = await db.execute(query)
        return result.scalars().first()


@app.get("/auth/callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        log("Callback function started", "DEBUG")
        
        # Get full URL
        full_url = str(request.url)
        log(f"Full callback URL: {full_url}", "DEBUG")
        
        # Extract query parameters
        query_params = dict(request.query_params)
        log(f"Received query params: {query_params}", "DEBUG")
        
        state = query_params.get("state")
        code = query_params.get("code")
        
        if not state or not code:
            log("Missing state or code parameter", "ERROR")
            return JSONResponse(status_code=400, content={"detail": "Missing parameters"})
            
        try:
            log("Creating flow with state", "DEBUG")
            flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
                CLIENT_SECRETS_FILE, SCOPES, state=state
            )
            flow.redirect_uri = "http://localhost:8000/auth/callback"
            
            log("About to fetch token", "DEBUG")
            flow.fetch_token(authorization_response=full_url)
            log("Token fetched successfully", "DEBUG")
            
            credentials = flow.credentials
            
            # Build the Google API service
            userinfo_service = build('oauth2', 'v2', credentials=credentials)
            user_info = userinfo_service.userinfo().get().execute()
            
            # Extract user information
            google_id = user_info.get('id')
            email = user_info.get('email')
            name = user_info.get('name')
            picture = user_info.get('picture')
            
            # Database operations in a proper async context
            async with db.begin():
                # Check if user exists
                query = select(User).where(User.google_id == google_id)
                result = await db.execute(query)
                user = result.scalars().first()
                
                if not user:
                    # Create new user
                    user = User(
                        google_id=google_id,
                        name=name,
                        email=email,
                        auth_provider="google",
                        profile_picture=picture,
                        access_token=credentials.token,
                        refresh_token=credentials.refresh_token,
                        token_expiry=credentials.expiry
                    )
                    db.add(user)
                else:
                    # Update existing user
                    user.name = name
                    user.email = email
                    user.profile_picture = picture
                    user.access_token = credentials.token
                    if credentials.refresh_token:  # Only update if a new refresh token is provided
                        user.refresh_token = credentials.refresh_token
                    user.token_expiry = credentials.expiry
            
            # No need for explicit commit, handled by async with db.begin()
            
            # Get the token to pass to the frontend
            access_token = credentials.token
            
            # Create a user data object to pass in the URL
            import urllib.parse
            user_data = urllib.parse.quote(json.dumps({
                "google_id": google_id,
                "name": name,
                "email": email,
                "profile_picture": picture,
                "access_token": access_token
            }))
            
            # Redirect to dashboard with user data
            dashboard_url = f"http://localhost:5173/?userData={user_data}"
            return RedirectResponse(url=dashboard_url)
            
        except Exception as inner_e:
            error_trace = traceback.format_exc()
            log(f"Flow error: {str(inner_e)}\n{error_trace}", "ERROR")
            return JSONResponse(status_code=500, content={"detail": f"OAuth flow error: {str(inner_e)}"})
            
    except Exception as e:
        error_trace = traceback.format_exc()
        log(f"OAuth Error: {str(e)}\n{error_trace}", "ERROR")
        return JSONResponse(status_code=500, content={"detail": f"OAuth error: {str(e)}"})
    
@app.get("/auth/user")
def get_authenticated_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    """Returns the currently authenticated user based on the provided access token."""
    if not authorization:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    token = authorization.split("Bearer ")[-1]  # Extract token
    query = select(User).where(User.access_token == token)
    result = db.execute(query)
    user = result.scalars().first()

    if not user:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    return {
        "google_id": user.google_id,
        "name": user.name,
        "email": user.email,
        "profile_picture": user.profile_picture,
    }

# Debug endpoint to check state storage
@app.get("/debug/state")
def debug_state():
    log(f"Current STATE_STORAGE: {STATE_STORAGE}", "DEBUG")
    return {"state_storage": STATE_STORAGE}

# Add a direct error testing endpoint
@app.get("/test-error")
def test_error():
    try:
        # Deliberately cause an error
        1/0
    except Exception as e:
        error_trace = traceback.format_exc()
        log(f"Test error: {str(e)}\n{error_trace}", "ERROR")
        return JSONResponse(status_code=500, content={"detail": f"Test error: {str(e)}"})

if __name__ == "__main__":
    import uvicorn
    log("Starting application", "INFO")
    uvicorn.run(app, port=8000)