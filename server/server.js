// The web server: serves the page in web/ and answers /api/... routes with JSON from SQL Server.
// Run with: npm start   then open http://localhost:3000
require('dotenv').config();
const path = require('path');
const express = require('express');
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true }
};

// One shared connection pool for the whole app.
const poolPromise = sql.connect(config);

const app = express();
app.use(express.json()); // lets routes read JSON the page sends (req.body)
app.use(express.static(path.join(__dirname, '..', 'web')));

// Small helper: run a route, and if anything throws, send the error back as JSON.
const route = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/courses -> every subject with how much you've studied it
app.get('/api/courses', route(async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT c.course_id, c.course_code, c.course_name,
           COUNT(s.session_id) AS sessions,
           SUM(CASE WHEN s.completed = 1 THEN 1 ELSE 0 END) AS completed_sessions,
           CAST(COALESCE(SUM(s.actual_minutes), 0) AS FLOAT) AS minutes_studied
    FROM dbo.courses c
    LEFT JOIN dbo.study_sessions s ON s.course_id = c.course_id
    GROUP BY c.course_id, c.course_code, c.course_name
    ORDER BY c.course_code`);
  res.json(result.recordset);
}));

// POST /api/courses  body: { course_code, course_name } -> adds a subject
app.post('/api/courses', route(async (req, res) => {
  const code = String(req.body.course_code || '').trim();
  const name = String(req.body.course_name || '').trim();
  if (!code || code.length > 20) return res.status(400).json({ error: 'Course code must be 1-20 characters.' });
  if (!name || name.length > 100) return res.status(400).json({ error: 'Course name must be 1-100 characters.' });

  const pool = await poolPromise;
  const result = await pool.request()
    .input('code', sql.NVarChar(20), code)
    .input('name', sql.NVarChar(100), name)
    .query('INSERT INTO dbo.courses (course_code, course_name) OUTPUT INSERTED.course_id VALUES (@code, @name)');
  res.status(201).json({ course_id: result.recordset[0].course_id });
}));

// POST /api/sessions  body: { course_id, planned_minutes } -> the timer was started
app.post('/api/sessions', route(async (req, res) => {
  const courseId = Number(req.body.course_id);
  const planned = Number(req.body.planned_minutes);
  if (!Number.isInteger(courseId)) return res.status(400).json({ error: 'Pick a subject first.' });
  if (!Number.isInteger(planned) || planned < 1 || planned > 600) {
    return res.status(400).json({ error: 'Minutes must be a whole number from 1 to 600.' });
  }

  const pool = await poolPromise;
  const result = await pool.request()
    .input('course_id', sql.Int, courseId)
    .input('planned', sql.Int, planned)
    .query('INSERT INTO dbo.study_sessions (course_id, planned_minutes) OUTPUT INSERTED.session_id VALUES (@course_id, @planned)');
  res.status(201).json({ session_id: result.recordset[0].session_id });
}));

// PUT /api/sessions/:id/finish  body: { actual_minutes, completed } -> timer finished or ended early
app.put('/api/sessions/:id/finish', route(async (req, res) => {
  const id = Number(req.params.id);
  const actual = Number(req.body.actual_minutes);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad session id.' });
  if (!Number.isFinite(actual) || actual < 0 || actual > 600) {
    return res.status(400).json({ error: 'actual_minutes must be between 0 and 600.' });
  }

  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('actual', sql.Decimal(6, 1), Math.round(actual * 10) / 10)
    .input('completed', sql.Bit, req.body.completed ? 1 : 0)
    .query(`UPDATE dbo.study_sessions
            SET ended_at = SYSUTCDATETIME(), actual_minutes = @actual, completed = @completed
            WHERE session_id = @id AND ended_at IS NULL`);
  if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'No open session with that id.' });
  res.json({ ok: true });
}));

// GET /api/sessions/recent -> your last 10 sessions
app.get('/api/sessions/recent', route(async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT TOP (10) s.session_id, c.course_code, s.planned_minutes,
           CAST(s.actual_minutes AS FLOAT) AS actual_minutes,
           s.completed, s.started_at, s.ended_at
    FROM dbo.study_sessions s
    JOIN dbo.courses c ON c.course_id = s.course_id
    ORDER BY s.started_at DESC`);
  res.json(result.recordset);
}));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`App running at http://localhost:${port}`));
