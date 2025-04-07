from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    email: str
    name: Optional[str]
    picture: Optional[str]
    access_token: str
    refresh_token: str
    token_expiry: Optional[str]
