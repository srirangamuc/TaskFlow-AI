from app.tasks.calendar import test_task

# Send the task to the queue
result = test_task.delay()

# Check status
print(result.status)  # Should be "PENDING" or "SUCCESS" eventually

# Get result value (waits for task to finish)
print(result.get(timeout=10))
