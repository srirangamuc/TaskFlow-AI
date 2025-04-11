# Import your tasks
from app.tasks.calendar import poll_calendar_events, test_task

# Test the simpler task first
result = test_task.delay()
print(f"Task ID: {result.id}")
print(f"Task result: {result.get()}")  # This will wait for the task to complete

# Now test the calendar polling task
poll_result = poll_calendar_events.delay()
print(f"Poll Task ID: {poll_result.id}")
# Don't need to call .get() if you just want to trigger it