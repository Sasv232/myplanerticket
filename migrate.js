import pg from "pg";
const { Pool } = pg;

const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL"); process.exit(1); }

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const migrations = [
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS label TEXT`,
  `CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tasks TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  )`,
];

async function migrate() {
  for (const stmt of migrations) {
    try {
      await pool.query(stmt);
      const match = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      const alterMatch = stmt.match(/ALTER TABLE (\w+)/);
      console.log(`OK: ${match?.[1] || alterMatch?.[1]}`);
    } catch (e) { console.error("ERR:", e.message); }
  }
  await pool.end();
  console.log("Done");
}

migrate();
