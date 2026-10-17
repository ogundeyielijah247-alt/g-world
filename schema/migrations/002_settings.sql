-- Settings store: operational values editable by admins without code changes.
-- Run: npx wrangler d1 execute g-world --remote --file=schema/migrations/002_settings.sql

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
