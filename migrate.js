const postgres = require('postgres');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL env var');
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 15 });

const migrations = [
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS trackers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    config TEXT NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    check_interval INTEGER NOT NULL DEFAULT 3600,
    last_checked TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scrape_results (
    id TEXT PRIMARY KEY,
    tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    scraped_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RUB',
    route_info TEXT DEFAULT '{}',
    recorded_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    tracker_id TEXT REFERENCES trackers(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL
  )`,
];

async function migrate() {
  for (const stmt of migrations) {
    try {
      await sql.unsafe(stmt);
      const table = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log(`OK: ${table}`);
    } catch (e) {
      console.error('ERR:', e.message);
    }
  }
  await sql.end();
  console.log('Done');
}

migrate();
