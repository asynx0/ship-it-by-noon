# My app

**Domain:**
Lofi Study Timer: a calm, dark-themed study timer that plays lofi music while I study and logs every study session per subject, so I can see where my study time actually goes.

**User story:** As a college student juggling several classes, I need to time my study sessions for each subject and see how many minutes I've studied each one and how many sessions I actually finished, so that I can notice which classes I'm neglecting or quitting early on and plan my week around them.

**What the user types or picks:**
- Picks a subject (or adds a new one: course code like INFO 430 and a course name)
- Types or picks how many minutes to study (presets: 15, 25, 50, 90)
- Presses Start / Pause / End early; lofi music plays while the timer runs, with an on/off switch and volume slider

**What the page shows (from the database):**
- Each subject with total minutes studied and sessions finished out of sessions started
- The 10 most recent sessions: subject, minutes studied vs. planned, finished or ended early, and when

**Tables (in my own database `<NetID>_myapp`):**
- `courses`: course_id (PK), course_code, course_name
- `study_sessions`: session_id (PK), course_id (FK → courses), planned_minutes, started_at, ended_at, actual_minutes, completed (yes/no)

**Next idea:** track snoozes (a "snooze 5 min" button) to see which subjects I put off the most.
