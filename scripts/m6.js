const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await c.connect();
  const queries = [
    "CREATE TABLE IF NOT EXISTS goals(id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, target_count INTEGER DEFAULT 10, current_count INTEGER DEFAULT 0, emoji TEXT, reset_period TEXT DEFAULT 'weekly', created_at TEXT)",
    "CREATE TABLE IF NOT EXISTS karma(id TEXT PRIMARY KEY, user_id TEXT UNIQUE, points INTEGER DEFAULT 0, level INTEGER DEFAULT 1, streak INTEGER DEFAULT 0, last_active_date TEXT, created_at TEXT, updated_at TEXT)",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id TEXT",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_after_complete BOOLEAN DEFAULT false",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS emoji TEXT",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TEXT",
  ];
  for (let i = 0; i < queries.length; i++) {
    try {
      await c.query(queries[i]);
      console.log((i + 1) + " OK");
    } catch (e) {
      console.log((i + 1) + " ERR: " + e.message.slice(0, 100));
    }
  }
  await c.end();
  console.log("DONE");
}

run();
