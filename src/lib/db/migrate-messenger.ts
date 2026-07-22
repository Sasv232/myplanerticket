import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

let migrated = false;
let migrating = false;

export async function ensureMessengerTables() {
  if (migrated) return;
  if (migrating) return;
  migrating = true;

  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'dm', name TEXT,
      emoji TEXT DEFAULT '💬', created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS conversation_members (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
      last_read_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc'),
      joined_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL, content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text', reply_to TEXT,
      edited BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
      id TEXT PRIMARY KEY, message_id TEXT NOT NULL,
      user_id TEXT NOT NULL, emoji TEXT NOT NULL,
      created_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS typing_indicators (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL, expires_at TEXT NOT NULL
    )`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`);

    migrated = true;
    console.log("✅ Messenger tables ready");
  } catch (error) {
    console.error("⚠️ Messenger migration error (will retry):", String(error).slice(0, 100));
    migrating = false;
  }
}
