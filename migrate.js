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
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    file_data TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_rule TEXT`,
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
