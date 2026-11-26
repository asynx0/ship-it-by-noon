-- Tables for the Lofi Study Timer. They live in your own database (DB_NAME in .env).
-- db/load.js runs these for you; you can also run them yourself in VS Code.

-- One row per subject you study (e.g. INFO 430).
CREATE TABLE courses (
    course_id   INT IDENTITY(1,1) PRIMARY KEY,
    course_code NVARCHAR(20)  NOT NULL,
    course_name NVARCHAR(100) NOT NULL
);

-- One row each time you press Start on the timer.
-- ended_at stays NULL until the timer finishes or you end it early.
CREATE TABLE study_sessions (
    session_id      INT IDENTITY(1,1) PRIMARY KEY,
    course_id       INT NOT NULL REFERENCES courses(course_id),
    planned_minutes INT NOT NULL CHECK (planned_minutes > 0),
    started_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ended_at        DATETIME2 NULL,
    actual_minutes  DECIMAL(6, 1) NULL,
    completed       BIT NOT NULL DEFAULT 0   -- 1 = timer ran all the way down
);
