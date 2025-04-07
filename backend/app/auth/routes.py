from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse,JSONResponse
from app.auth.oauth import get_google_auth_url, exchange_code_for_tokens, get_user_info
from app.database.db import get_connection
import datetime
from app.utils.helpers import create_jwt


router = APIRouter()

@router.get("/login")
async def login():
    return RedirectResponse(url=get_google_auth_url())


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

    # Save to DB
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
        
        jwt_token = create_jwt({
            "email": email,
            "name": name
        })

        response = JSONResponse(content={"message": "Login successful"})
        response.set_cookie(key="access_token", value=jwt_token, httponly=True)
        return response