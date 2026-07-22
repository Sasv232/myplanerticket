import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Только админ" }, { status: 403 });
    }

    const results: string[] = [];

    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'dm', name TEXT,
        emoji TEXT DEFAULT '💬', created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
      )`);
      results.push("conversations ✓");
    } catch (e) { results.push("conversations ERROR: " + String(e).slice(0, 80)); }

    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS conversation_members (
        id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
        last_read_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc'),
        joined_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc'),
        UNIQUE(conversation_id, user_id)
      )`);
      results.push("conversation_members ✓");
    } catch (e) { results.push("conversation_members ERROR: " + String(e).slice(0, 80)); }

    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL, content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text', reply_to TEXT,
        edited BOOLEAN DEFAULT false,
        created_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
      )`);
      results.push("messages ✓");
    } catch (e) { results.push("messages ERROR: " + String(e).slice(0, 80)); }

    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY, message_id TEXT NOT NULL,
        user_id TEXT NOT NULL, emoji TEXT NOT NULL,
        created_at TEXT DEFAULT (NOW() AT TIME ZONE 'utc')
      )`);
      results.push("message_reactions ✓");
    } catch (e) { results.push("message_reactions ERROR: " + String(e).slice(0, 80)); }

    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS typing_indicators (
        id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL, expires_at TEXT NOT NULL
      )`);
      results.push("typing_indicators ✓");
    } catch (e) { results.push("typing_indicators ERROR: " + String(e).slice(0, 80)); }

    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`);
      results.push("indexes ✓");
    } catch (e) { results.push("indexes ERROR: " + String(e).slice(0, 80)); }

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
