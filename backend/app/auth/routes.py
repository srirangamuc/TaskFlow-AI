from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response,RedirectResponse,JSONResponse
from app.auth.oauth import get_google_auth_url, exchange_code_for_tokens, get_user_info
from app.database.db import get_connection
import datetime
from app.utils.helpers import create_jwt,verify_jwt
import requests

router = APIRouter()

# Function to refresh the access token
async def refresh_access_token(refresh_token: str, client_id: str, client_secret: str):
    url = "https://oauth2.googleapis.com/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
    }
    response = requests.post(url, data=data, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=400, detail="Failed to refresh access token")

@router.get("/login")
async def login():
    return RedirectResponse(url=get_google_auth_url())

@router.get("/logout")
async def logout():
    response = JSONResponse(content={"message": "Successfully logged out"})
    response.delete_cookie(key="access_token")  # Delete the cookie
    return response

@router.get("/callback")
async def callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided.")

    # Exchange code for tokens
    token_data = await exchange_code_for_tokens(code)
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")

    # Fetch user info
    user_info = await get_user_info(access_token)
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")
    token_expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)

    # Save the token and user info to DB
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (email, name, picture, access_token, refresh_token)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE
                SET name = EXCLUDED.name,
                    picture = EXCLUDED.picture,
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token
                """,
                (email, name, picture, access_token, refresh_token)
            )
        
        # Create a JWT token for the user session
        jwt_token = create_jwt({
            "email": email,
            "name": name,
            "picture": picture,
            "access_token":access_token,
            "refresh_token":refresh_token
        })

        response = RedirectResponse(url="http://localhost:5173")
        response.set_cookie(key="access_token", value=jwt_token, httponly=True, max_age=3600, secure=True, samesite='None',domain='.localhost')
        return response

@router.get("/userinfo")
async def userinfo(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    
    try:
        payload = verify_jwt(token)
    except Exception as e:
        # If JWT verification fails (i.e., token expired), refresh the token
        user_email = request.cookies.get("user_email")  # Assuming user email is in cookie or headers
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found in cookies")

        # Fetch refresh token from DB based on the user's email
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT refresh_token FROM users WHERE email = %s", (user_email,))
                result = cur.fetchone()
                if not result:
                    raise HTTPException(status_code=401, detail="User not found")
                refresh_token = result[0]

        # Refresh the token
        new_token_data = await refresh_access_token(refresh_token, "<YOUR_CLIENT_ID>", "<YOUR_CLIENT_SECRET>")
        new_access_token = new_token_data["access_token"]
        new_expires_in = new_token_data["expires_in"]

        # Update the database with the new access token
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET access_token = %s WHERE email = %s",
                    (new_access_token, user_email)
                )

        # Generate a new JWT for the user session
        new_jwt_token = create_jwt({
            "email": user_email,
            "name": payload["name"],  # Keep using the existing name from the payload
            "picture": payload["picture"]
        })

        # Set the new JWT in the cookies
        response = JSONResponse({"message": "Token refreshed"})
        response.set_cookie(key="access_token", value=new_jwt_token, httponly=True, max_age=3600, secure=True, samesite='None',domain=".localhost")
        return response

    # If token is still valid, return the user info
    return {"email": payload["email"], "name": payload["name"], "picture": payload["picture"]}