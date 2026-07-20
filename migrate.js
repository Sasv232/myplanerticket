import pg from "pg";
const { Pool } = pg;

const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL"); process.exit(1); }

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const migrations = [
  `CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    note TEXT,
    started_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
];

async function migrate() {
  for (const stmt of migrations) {
    try {
      await pool.query(stmt);
      const match = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      console.log(`OK: ${match?.[1]}`);
    } catch (e) { console.error("ERR:", e.message); }
  }
  await pool.end();
  console.log("Done");
}

migrate();
