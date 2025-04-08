from celery import shared_task
from app.celery_worker import celery_app
from app.services.google_api import fetch_and_store_calendar_events

@celery_app.task
def poll_calendar_events():
    print("Polling calendar events for all users...")
    fetch_and_store_calendar_events()
    print("New Users Stored in Database")


@celery_app.task
def test_task():
    print("Celery is here!")
    return "Hello from Celery"
