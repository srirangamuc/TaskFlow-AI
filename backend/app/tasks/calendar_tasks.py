from celery import shared_task
from app.database.db import get_connection
from app.services.google_api import fetch_and_store_user_events

@shared_task
def sync_all_users_calendars():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT email, access_token, refresh_token FROM users")
        users = cur.fetchall()
    conn.close()

    for email, access_token, refresh_token in users:
        try:
            fetch_and_store_user_events(email, access_token, refresh_token)
            print(f"✅ Synced events for {email}")
        except Exception as e:
            print(f"❌ Failed to sync for {email}: {e}")
