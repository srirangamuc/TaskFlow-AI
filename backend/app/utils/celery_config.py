from celery.schedules import crontab

beat_schedule = {
    'sync_all_users_calendars_task': {
        'task': 'app.tasks.calendar_tasks.sync_all_users_calendars',
        'schedule': crontab(minute=0, hour=0),  # This means daily at midnight
    },

}
