import psycopg
from app.config import settings

def get_connection():
    return psycopg.connect(settings.DATABASE_URL, autocommit=True)
