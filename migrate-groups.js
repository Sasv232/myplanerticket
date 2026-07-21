const { Client } = require('pg');
const client = new Client('postgresql://postgres.uqzqgrbkgbwnhapsciwb:sasvqwert4671@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');

async function migrate() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_invites (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member',
      max_uses INTEGER,
      uses INTEGER DEFAULT 0,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_activity (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
  `);
  console.log('Group project tables created!');
  await client.end();
}
migrate().catch(e => { console.error(e); process.exit(1); });
