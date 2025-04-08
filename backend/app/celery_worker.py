from celery import Celery
from app.config import settings

celery_app = Celery(
    "taskflowai",
    broker=settings.REDIS_BROKER_URL,
    backend=settings.REDIS_BROKER_URL,
    include=["app.tasks.calendar"]
)

celery_app.conf.beat_schedule = {
    "poll-calendar-every-1-minutes": {
        "task": "app.tasks.calendar.poll_calendar_events",
        "schedule": 60.0,  # 1 minutes
    }
}

celery_app.conf.timezone = 'UTC'
