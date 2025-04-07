import requests
from datetime import datetime, timedelta
from app.database.db import get_db_connection
from app.services.google_api import refresh_access_token, fetch_calendar_events
from app.celery_worker import celery_app

@celery_app.task
def poll_calendar_events():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT email, access_token, refresh_token FROM users;")
    users = cur.fetchall()

    for user in users:
        email, access_token, refresh_token = user

        events = fetch_calendar_events(access_token)

        if events is None:
            # Token might be expired, try refreshing
            new_tokens = refresh_access_token(refresh_token)
            if new_tokens:
                access_token = new_tokens["access_token"]
                cur.execute(
                    "UPDATE users SET access_token = %s WHERE email = %s",
                    (access_token, email)
                )
                conn.commit()

                events = fetch_calendar_events(access_token)

        # Store fetched events in DB
        if events:
            for event in events:
                cur.execute(
                    """
                    INSERT INTO events (user_email, event_id, summary, start_time, end_time)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (event_id) DO NOTHING;
                    """,
                    (
                        email,
                        event.get("id"),
                        event.get("summary"),
                        event["start"]["dateTime"],
                        event["end"]["dateTime"]
                    )
                )
    conn.commit()
    cur.close()
    conn.close()
