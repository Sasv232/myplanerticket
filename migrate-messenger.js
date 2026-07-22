const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'dm',
        name TEXT,
        emoji TEXT DEFAULT '💬',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // 2. Conversation members
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        last_read_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc'),
        joined_at TEXT NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(conversation_id, user_id)
      )
    `);

    // 3. Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        reply_to TEXT,
        edited BOOLEAN DEFAULT false,
        created_at TEXT NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL
      )
    `);

    // 4. Message reactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(message_id, user_id, emoji)
      )
    `);

    // 5. Typing indicators
    await client.query(`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reactions_msg ON message_reactions(message_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_typing_conv ON typing_indicators(conversation_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_typing_expires ON typing_indicators(expires_at)`);

    await client.query("COMMIT");
    console.log("✅ Messenger tables created successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
