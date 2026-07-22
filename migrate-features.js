const { Pool } = require("pg");
const fs = require("fs");

// Read DATABASE_URL from .env.local
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const envContent = fs.readFileSync(".env.local", "utf8");
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match) dbUrl = match[1].trim();
  } catch {}
}

if (!dbUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

console.log("Connecting to:", dbUrl.substring(0, 50) + "...");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migration...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        mood TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT NOW()::TEXT
      );
    `);
    console.log("✓ mood_entries table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_mentions (
        id TEXT PRIMARY KEY,
        comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
        mentioned_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        task_id TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL DEFAULT NOW()::TEXT
      );
    `);
    console.log("✓ user_mentions table created");

    // Add repeat_after_complete column if not exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_after_complete BOOLEAN DEFAULT FALSE;
      EXCEPTION WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log("✓ tasks.repeat_after_complete column ensured");

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
