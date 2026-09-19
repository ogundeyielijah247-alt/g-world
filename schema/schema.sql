PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS members (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 gworld_id TEXT NOT NULL UNIQUE,
 full_name TEXT NOT NULL,
 phone TEXT NOT NULL UNIQUE,
 email TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'IN TRAINING',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_profiles (
 member_id INTEGER PRIMARY KEY,
 avatar_url TEXT,
 bio TEXT,
 professional_presence_status TEXT DEFAULT 'NOT_STARTED',
 FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 content_type TEXT NOT NULL,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'DRAFT',
 summary TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 member_id INTEGER,
 event_type TEXT NOT NULL,
 metadata_json TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_member_id ON audit_events(member_id);

/* =========================================================
   G WORLD COURSE ENGINE — FOUNDATION
   ========================================================= */

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  course_type TEXT NOT NULL DEFAULT 'UNIVERSITY',
  summary TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  access_type TEXT NOT NULL DEFAULT 'PREVIEW',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS course_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  module_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(course_id, slug),
  UNIQUE(course_id, module_order)
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'LESSON',
  explanation TEXT,
  lesson_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  access_type TEXT NOT NULL DEFAULT 'PREMIUM',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
  UNIQUE(module_id, slug),
  UNIQUE(module_id, lesson_order)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(member_id, course_id)
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  module_id INTEGER,
  lesson_id INTEGER,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY(module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE(member_id, lesson_id)
);

/* Course Engine indexes */

CREATE INDEX IF NOT EXISTS idx_courses_department_id
  ON courses(department_id);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id
  ON course_modules(course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id
  ON lessons(module_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_member_id
  ON course_enrollments(member_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
  ON course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_member_id
  ON learning_progress(member_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_course_id
  ON learning_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_lesson_id
  ON learning_progress(lesson_id);
