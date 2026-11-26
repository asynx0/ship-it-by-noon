// Creates the timer tables in your own database (DB_NAME in .env) and adds a few made-up subjects.
// Safe to run more than once: tables are only created if missing, subjects only added if there are none.
// Run with: node db/load.js
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true }
};

const sampleCourses = [
  { code: 'INFO 430', name: 'Database Systems' },
  { code: 'MATH 126', name: 'Calculus III' },
  { code: 'PSYCH 101', name: 'Intro to Psychology' }
];

(async () => {
  const pool = await sql.connect(config);
  try {
    await pool.request().query(`
      IF OBJECT_ID('dbo.courses', 'U') IS NULL
      CREATE TABLE dbo.courses (
        course_id   INT IDENTITY(1,1) PRIMARY KEY,
        course_code NVARCHAR(20)  NOT NULL,
        course_name NVARCHAR(100) NOT NULL
      );`);

    await pool.request().query(`
      IF OBJECT_ID('dbo.study_sessions', 'U') IS NULL
      CREATE TABLE dbo.study_sessions (
        session_id      INT IDENTITY(1,1) PRIMARY KEY,
        course_id       INT NOT NULL REFERENCES dbo.courses(course_id),
        planned_minutes INT NOT NULL CHECK (planned_minutes > 0),
        started_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ended_at        DATETIME2 NULL,
        actual_minutes  DECIMAL(6, 1) NULL,
        completed       BIT NOT NULL DEFAULT 0
      );`);
    console.log('Tables courses and study_sessions are ready.');

    const count = (await pool.request().query('SELECT COUNT(*) AS n FROM dbo.courses')).recordset[0].n;
    if (count > 0) {
      console.log(`courses already has ${count} rows; not adding more.`);
    } else {
      for (const c of sampleCourses) {
        await pool.request()
          .input('code', sql.NVarChar(20), c.code)
          .input('name', sql.NVarChar(100), c.name)
          .query('INSERT INTO dbo.courses (course_code, course_name) VALUES (@code, @name)');
      }
      console.log(`Inserted ${sampleCourses.length} sample subjects.`);
    }

    // 20 made-up past study sessions, so the page has real rows to show.
    // Each: [which subject (0 = first, 1 = second, ...), days ago, hour of day, planned min, actual min, finished?]
    const sampleSessions = [
      [0, 13, 19, 50, 50, 1], [1, 13, 21, 25, 25, 1], [2, 12, 15, 25, 10.5, 0], [0, 11, 20, 50, 50, 1],
      [1, 10, 22, 25, 8, 0],  [0, 9, 18, 25, 25, 1],  [2, 9, 14, 50, 50, 1],    [1, 8, 20, 50, 31.5, 0],
      [0, 7, 19, 90, 90, 1],  [2, 6, 16, 25, 25, 1],  [1, 5, 21, 25, 25, 1],    [0, 5, 23, 25, 12, 0],
      [2, 4, 13, 25, 4.5, 0], [1, 3, 20, 50, 50, 1],  [0, 3, 18, 50, 50, 1],    [2, 2, 15, 50, 22, 0],
      [0, 2, 20, 25, 25, 1],  [1, 1, 19, 25, 25, 1],  [2, 1, 17, 25, 25, 1],    [0, 1, 22, 15, 15, 1]
    ];
    // Only add them if there is no session older than 12 hours (so samples are never added twice,
    // and the timer sessions you just tried today don't block them).
    const oldCount = (await pool.request().query(
      'SELECT COUNT(*) AS n FROM dbo.study_sessions WHERE started_at < DATEADD(HOUR, -12, SYSUTCDATETIME())'
    )).recordset[0].n;
    const courseIds = (await pool.request().query('SELECT course_id FROM dbo.courses ORDER BY course_id')).recordset.map((r) => r.course_id);
    if (oldCount > 0) {
      console.log('study_sessions already has past sessions; not adding sample sessions.');
    } else {
      for (const [which, daysAgo, hour, planned, actual, completed] of sampleSessions) {
        const start = new Date();
        start.setDate(start.getDate() - daysAgo);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + actual * 60000);
        await pool.request()
          .input('course_id', sql.Int, courseIds[which % courseIds.length])
          .input('planned', sql.Int, planned)
          .input('started', sql.DateTime2, start)
          .input('ended', sql.DateTime2, end)
          .input('actual', sql.Decimal(6, 1), actual)
          .input('completed', sql.Bit, completed)
          .query(`INSERT INTO dbo.study_sessions (course_id, planned_minutes, started_at, ended_at, actual_minutes, completed)
                  VALUES (@course_id, @planned, @started, @ended, @actual, @completed)`);
      }
      console.log(`Inserted ${sampleSessions.length} sample study sessions.`);
    }
  } catch (err) {
    console.log('LOAD FAILED: ' + err.message);
    process.exitCode = 1;
  } finally {
    await pool.close();
  }
})();
