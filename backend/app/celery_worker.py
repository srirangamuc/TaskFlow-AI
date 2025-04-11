from celery import Celery
from app.config import settings
from app.utils.celery_config import beat_schedule
from app.tasks import calendar_tasks

celery_app = Celery(
    "taskflowai",
    broker=settings.REDIS_BROKER_URL,
    backend=settings.REDIS_BROKER_URL,
)

celery_app.conf.timezone = 'UTC'
celery_app.autodiscover_tasks(["app.tasks"])
celery_app.conf.beat_schedule = beat_schedule