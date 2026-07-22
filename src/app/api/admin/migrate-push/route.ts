import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    const migrations = [
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (now()::text)
      )`,
      `CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        messenger BOOLEAN NOT NULL DEFAULT true,
        deadlines BOOLEAN NOT NULL DEFAULT true,
        habits BOOLEAN NOT NULL DEFAULT true,
        server_errors BOOLEAN NOT NULL DEFAULT true,
        maintenance BOOLEAN NOT NULL DEFAULT true,
        reminder_time TEXT NOT NULL DEFAULT '20:00',
        created_at TEXT NOT NULL DEFAULT (now()::text),
        updated_at TEXT NOT NULL DEFAULT (now()::text)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_push_sub_endpoint ON push_subscriptions(endpoint)`,
      `CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id)`,
    ];

    let ok = 0;
    for (const m of migrations) {
      try {
        await db.execute(sql.raw(m));
        ok++;
      } catch (e: any) {
        console.error("Migration error:", e.message);
      }
    }

    return NextResponse.json({ ok: true, applied: ok });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
