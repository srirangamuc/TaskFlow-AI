import requests
import os
import datetime

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_EVENTS_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

def refresh_access_token(refresh_token: str):
    response = requests.post(GOOGLE_TOKEN_URL, data={
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    })

    if response.status_code == 200:
        return response.json()
    return None

def fetch_calendar_events(access_token: str):
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "timeMin": datetime.utcnow().isoformat() + "Z",
        "maxResults": 10,
        "singleEvents": True,
        "orderBy": "startTime",
    }

    response = requests.get(GOOGLE_EVENTS_API, headers=headers, params=params)
    if response.status_code == 200:
        return response.json().get("items", [])
    return None
