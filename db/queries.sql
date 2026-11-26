-- The queries server/server.js runs. Words starting with @ are parameters the server fills in.
-- To try one in VS Code, replace each @value with a real value first.

-- GET /api/courses : every subject with its study totals
SELECT c.course_id, c.course_code, c.course_name,
       COUNT(s.session_id) AS sessions,
       SUM(CASE WHEN s.completed = 1 THEN 1 ELSE 0 END) AS completed_sessions,
       CAST(COALESCE(SUM(s.actual_minutes), 0) AS FLOAT) AS minutes_studied
FROM dbo.courses c
LEFT JOIN dbo.study_sessions s ON s.course_id = c.course_id
GROUP BY c.course_id, c.course_code, c.course_name
ORDER BY c.course_code;

-- POST /api/courses : add a subject
INSERT INTO dbo.courses (course_code, course_name)
OUTPUT INSERTED.course_id
VALUES (@code, @name);

-- POST /api/sessions : the timer was started
INSERT INTO dbo.study_sessions (course_id, planned_minutes)
OUTPUT INSERTED.session_id
VALUES (@course_id, @planned);

-- PUT /api/sessions/:id/finish : the timer finished or was ended early
UPDATE dbo.study_sessions
SET ended_at = SYSUTCDATETIME(), actual_minutes = @actual, completed = @completed
WHERE session_id = @id AND ended_at IS NULL;

-- GET /api/sessions/recent : the last 10 sessions
SELECT TOP (10) s.session_id, c.course_code, s.planned_minutes, s.actual_minutes,
       s.completed, s.started_at, s.ended_at
FROM dbo.study_sessions s
JOIN dbo.courses c ON c.course_id = s.course_id
ORDER BY s.started_at DESC;
