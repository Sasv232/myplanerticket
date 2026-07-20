const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL env var");
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`,
  `ALTER TABLE trackers ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`,
];

async function migrate() {
  for (const stmt of migrations) {
    try {
      await pool.query(stmt);
      const match = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      const alterMatch = stmt.match(/ALTER TABLE (\w+)/);
      const table = match?.[1] || alterMatch?.[1] || "unknown";
      console.log(`OK: ${table}`);
    } catch (e) {
      console.error("ERR:", e.message);
    }
  }
  await pool.end();
  console.log("Done");
}

migrate();
