const { Client } = require('pg');
const client = new Client('postgresql://postgres.uqzqgrbkgbwnhapsciwb:sasvqwert4671@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');

async function migrate() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      meal_type TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS water_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weight REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS health_profile (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      height REAL,
      birth_date TEXT,
      gender TEXT,
      activity_level TEXT DEFAULT 'sedentary',
      daily_calorie_goal REAL,
      daily_water_goal REAL,
      created_at TEXT NOT NULL DEFAULT (now()::text),
      updated_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  console.log('Fitness tables created!');
  await client.end();
}
migrate().catch(e => { console.error(e); process.exit(1); });
