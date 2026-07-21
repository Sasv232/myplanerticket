const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const q = [
    "CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, user_id TEXT, name TEXT NOT NULL, emoji TEXT, color TEXT, created_at TEXT)",
    "CREATE TABLE IF NOT EXISTS subtasks(id TEXT PRIMARY KEY, task_id TEXT NOT NULL, title TEXT NOT NULL, completed BOOLEAN DEFAULT false, \"order\" INTEGER DEFAULT 0, created_at TEXT)",
    "CREATE TABLE IF NOT EXISTS habits(id TEXT PRIMARY KEY, user_id TEXT, name TEXT NOT NULL, emoji TEXT, color TEXT, frequency TEXT DEFAULT 'daily', target_count INTEGER DEFAULT 1, created_at TEXT)",
    "CREATE TABLE IF NOT EXISTS habit_logs(id TEXT PRIMARY KEY, habit_id TEXT NOT NULL, date TEXT NOT NULL, count INTEGER DEFAULT 1, note TEXT, created_at TEXT)",
    "CREATE TABLE IF NOT EXISTS goals(id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, target_count INTEGER DEFAULT 10, current_count INTEGER DEFAULT 0, emoji TEXT, reset_period TEXT DEFAULT 'weekly', created_at TEXT)",
    "CREATE TABLE IF NOT EXISTS karma(id TEXT PRIMARY KEY, user_id TEXT UNIQUE, points INTEGER DEFAULT 0, level INTEGER DEFAULT 1, streak INTEGER DEFAULT 0, last_active_date TEXT, created_at TEXT, updated_at TEXT)",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id TEXT",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_after_complete BOOLEAN DEFAULT false",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS emoji TEXT",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TEXT",
  ];
  for (let i = 0; i < q.length; i++) {
    try {
      await pool.query(q[i]);
      console.log((i + 1) + " OK");
    } catch (e) {
      console.log((i + 1) + " SKIP: " + e.message.slice(0, 60));
    }
  }
  await pool.end();
  console.log("DONE");
}
run();
