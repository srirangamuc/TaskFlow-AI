from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.utils.helpers import get_current_user
from app.dashboard.routes import router as dashboard_router

app = FastAPI()
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "'https://lh3.googleusercontent.com/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(dashboard_router, prefix="/dashboard")


@app.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}