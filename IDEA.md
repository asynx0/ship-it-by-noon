# My app

**Domain:**
Study Snooze Tracker: a log of my study sessions and how often I hit "snooze" on my study-time reminders.

**User story:** As a college student juggling several classes, I need to see which courses and times of day I snooze my study reminders the most, so that I can reschedule study blocks to times I will actually follow through on.

**What the user types or picks:**
- Course: course_id, course_code (e.g. INFO 430), course_name
- StudySession: session_id, course_id, planned_start, planned_minutes, actual_start, completed (yes/no)
- Snooze: snooze_id, session_id, snoozed_at, snooze_minutes
A table of courses with total planned sessions, total snoozes, average snooze minutes, and completion rate, sorted by most snoozed. Optional filter by course or day of week.