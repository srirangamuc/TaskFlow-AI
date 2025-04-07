from fastapi import FastAPI,Depends
from app.auth.routes import router as auth_router
from app.utils.helpers import get_current_user


app = FastAPI()

app.include_router(auth_router, prefix="/auth")

@app.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}