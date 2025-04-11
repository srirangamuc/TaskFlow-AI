import jwt
from datetime import datetime, timedelta
from app.config import settings
from fastapi import Request, HTTPException, Depends


JWT_SECRET = settings.JWT_SECRET # move to env later
ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = 60 * 24 * 30  # 24 hours

def create_jwt(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def verify_jwt(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = verify_jwt(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user
