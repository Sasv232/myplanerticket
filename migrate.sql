CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#e0e7ff',
  pinned BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  pinned BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
