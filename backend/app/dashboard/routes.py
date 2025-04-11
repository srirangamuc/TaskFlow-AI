from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException
from app.database.db import get_connection
from app.utils.helpers import verify_jwt
from datetime import datetime,timedelta,timezone
from app.services.google_api import fetch_and_store_user_events

router = APIRouter()

@router.post("/sync-events")
def sync_events(request: Request):
    jwt_token = request.cookies.get("access_token")
    print(jwt_token)
    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_jwt(jwt_token)
    print(payload)
    email = payload.get("email")
    access_token = payload.get("access_token")
    refresh_token = payload.get("refresh_token")

    if not all([email, access_token, refresh_token]):
        raise HTTPException(status_code=400, detail="Invalid token payload")

    success = fetch_and_store_user_events(email, access_token, refresh_token)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to fetch events")

    return {"message": "Calendar events synced."}


@router.get("/calendar-events")
def get_calendar_events(request: Request):
    jwt_token = request.cookies.get("access_token")
    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    print(jwt_token)
    
    payload = verify_jwt(jwt_token)
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="User email not found in token")
    
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT event_id, summary, start_time, end_time FROM calendar_events WHERE email = %s",
            (email,)
        )
        events = cur.fetchall()
    conn.close()
    
    events_list = []
    for event in events:
        events_list.append({
            "event_id": event[0],
            "summary": event[1],
            "start_time": event[2],
            "end_time": event[3],
        })
    
    return {"events": events_list}


@router.get("/weekly-activity")
def get_weekly_activity(request: Request):
    jwt_token = request.cookies.get("access_token")
    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_jwt(jwt_token)
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in token")

    # Set range: today to today + 6 days
    today = datetime.now(timezone.utc).date()
    start_datetime = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    end_datetime = start_datetime + timedelta(days=7)

    print(f"📆 Today: {today}, Range: {start_datetime} to {end_datetime}")

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT start_time, end_time FROM calendar_events
            WHERE email = %s AND start_time >= %s AND start_time < %s
        """, (email, start_datetime, end_datetime))
        events = cur.fetchall()
    conn.close()

    print(f"📌 Fetched {len(events)} events")
    for s, e in events:
        print(f"🕒 {s} to {e} ({(e - s).total_seconds() / 3600.0} hrs)")

    daily_totals = defaultdict(float)
    for start_time, end_time in events:
        try:
            duration_hours = (end_time - start_time).total_seconds() / 3600.0
            day_key = start_time.date().isoformat()
            daily_totals[day_key] += duration_hours
        except Exception as e:
            print(f"Skipping event due to error: {e}")
            continue

    results = []
    for i in range(7):
        day = (today + timedelta(days=i)).isoformat()
        results.append({
            "date": day,
            "hours": round(daily_totals.get(day, 0), 2)
        })

    print("📊 Weekly Totals (Upcoming 7 Days):", results)
    return {"weekly_activity": results}


