const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000,
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Create NEW tables first (before altering tasks)
    console.log("Creating projects table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        emoji TEXT DEFAULT '📁',
        color TEXT DEFAULT '#3b82f6',
        created_at TEXT
      )
    `);
    console.log("OK");

    console.log("Creating subtasks table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        "order" INTEGER DEFAULT 0,
        created_at TEXT
      )
    `);
    console.log("OK");

    console.log("Creating habits table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        emoji TEXT DEFAULT '✅',
        color TEXT DEFAULT '#22c55e',
        frequency TEXT DEFAULT 'daily',
        target_count INTEGER DEFAULT 1,
        created_at TEXT
      )
    `);
    console.log("OK");

    console.log("Creating habit_logs table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        note TEXT,
        created_at TEXT
      )
    `);
    console.log("OK");

    console.log("Creating goals table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        target_count INTEGER DEFAULT 10,
        current_count INTEGER DEFAULT 0,
        emoji TEXT DEFAULT '🎯',
        reset_period TEXT DEFAULT 'weekly',
        created_at TEXT
      )
    `);
    console.log("OK");

    console.log("Creating karma table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS karma (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        last_active_date TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    console.log("OK");

    // NOW alter tasks table (projects table exists)
    console.log("Altering tasks table...");
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id)`);
    console.log("Added project_id");
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_after_complete BOOLEAN DEFAULT false`);
    console.log("Added repeat_after_complete");
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS emoji TEXT`);
    console.log("Added emoji");
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TEXT`);
    console.log("Added completed_at");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
