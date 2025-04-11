import logging
import requests
import hashlib
import uuid
from datetime import datetime,timezone,timedelta
import pytz

from app.database.db import get_connection
from app.auth.oauth import refresh_access_token

logger = logging.getLogger(__name__)
GOOGLE_EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

def get_next_seven_days_range():
    now = datetime.now(pytz.UTC)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=7)
    return start, end


def fetch_and_store_user_events(email: str, access_token: str, refresh_token: str):
    try:
        # Calculate current week's time boundaries
        week_start, week_end = get_next_seven_days_range()
        time_min = week_start.isoformat()
        time_max = week_end.isoformat()

        # Set up parameters for the current week
        params = {
            "timeMin": time_min,
            "timeMax": time_max,
            "singleEvents": True,
            "orderBy": "startTime"
        }
        headers = {"Authorization": f"Bearer {access_token}"}
        res = requests.get(GOOGLE_EVENTS_ENDPOINT, headers=headers, params=params)

        # If token expired, try refreshing it
        if res.status_code == 401:
            logger.info(f"Access token expired for {email}, attempting to refresh.")
            new_tokens = refresh_access_token(refresh_token)
            if not new_tokens:
                logger.error(f"Could not refresh token for {email}")
                return False

            access_token = new_tokens["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            res = requests.get(GOOGLE_EVENTS_ENDPOINT, headers=headers, params=params)

            # Update DB with new token
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET access_token = %s WHERE email = %s",
                    (access_token, email)
                )
                conn.commit()
            conn.close()

        if res.status_code != 200:
            logger.error(f"Failed to fetch events for {email}: {res.status_code} - {res.text}")
            return False

        events = res.json().get("items", [])
        logger.info(f"Retrieved {len(events)} events for {email} between {time_min} and {time_max}")

        # Step 1: Create or reuse the sync session for this week.
        conn = get_connection()
        with conn.cursor() as cur:
            # Check if a session exists for this user and week_start
            cur.execute(
                "SELECT session_id FROM user_sync_sessions WHERE email = %s AND week_start = %s",
                (email, week_start)
            )
            row = cur.fetchone()
            if row:
                session_id = row[0]
                logger.info(f"Reusing session_id {session_id} for user {email} for week starting {week_start}")
            else:
                # Create a new sync session for this week
                cur.execute(
                    "INSERT INTO user_sync_sessions (email, week_start) VALUES (%s, %s) RETURNING session_id",
                    (email, week_start)
                )
                session_id = cur.fetchone()[0]
                logger.info(f"Created new session_id {session_id} for user {email} for week starting {week_start}")
            conn.commit()
        conn.close()

        # Step 2: Insert or update events for this sync session.
        conn = get_connection()
        with conn.cursor() as cur:
            for event in events:
                event_id = event["id"]
                summary = event.get("summary", "")
                start_time = event["start"].get("dateTime", event["start"].get("date"))
                end_time = event["end"].get("dateTime", event["end"].get("date"))
                try:
                    cur.execute(
                        "INSERT INTO calendar_events (event_id, session_id, email, summary, start_time, end_time) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (event_id, session_id) DO NOTHING",
                        (event_id, session_id, email, summary, start_time, end_time)
                    )

                except Exception as e:
                    logger.error(f"Error inserting event {event_id} for {email}: {str(e)}")
            conn.commit()
        conn.close()

        return True

    except Exception as e:
        logger.error(f"Unhandled error while processing events for {email}: {str(e)}", exc_info=True)
        return False
