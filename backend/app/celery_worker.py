from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

celery_app.conf.beat_schedule = {
     "fetch-calendar-events-every-10-mins": {
        "task": "app.tasks.fetch_events.poll_calendar_events",
        "schedule": crontab(minute="*/10"),
    }
}
celery_app.conf.timezone = 'UTC'