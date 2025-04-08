import requests
from app.database.db import get_connection
from app.auth.oauth import refresh_access_token

GOOGLE_EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

def fetch_and_store_calendar_events():
    conn = get_connection()
    cur = conn.cursor()
    
    # Get all users
    cur.execute("SELECT email, access_token, refresh_token FROM users")
    users = cur.fetchall()

    for email, access_token, refresh_token in users:
        # Try fetching events
        headers = {"Authorization": f"Bearer {access_token}"}
        res = requests.get(GOOGLE_EVENTS_ENDPOINT, headers=headers)

        if res.status_code == 401:
            # Access token expired, refresh it
            new_tokens = refresh_access_token(refresh_token)
            if new_tokens:
                access_token = new_tokens['access_token']
                cur.execute("UPDATE users SET access_token = %s WHERE email = %s", (access_token, email))
                conn.commit()
                # Retry with new access token
                headers = {"Authorization": f"Bearer {access_token}"}
                res = requests.get(GOOGLE_EVENTS_ENDPOINT, headers=headers)

        if res.status_code == 200:
            events = res.json().get("items", [])
            for event in events:
                event_id = event["id"]
                summary = event.get("summary", "")
                start_time = event["start"].get("dateTime", event["start"].get("date"))
                end_time = event["end"].get("dateTime", event["end"].get("date"))

                cur.execute(
                    "INSERT INTO calendar_events (email, event_id, summary, start_time, end_time) "
                    "VALUES (%s, %s, %s, %s, %s) "
                    "ON CONFLICT (event_id) DO NOTHING",
                    (email, event_id, summary, start_time, end_time)
                )
            conn.commit()
    
    cur.close()
    conn.close()
