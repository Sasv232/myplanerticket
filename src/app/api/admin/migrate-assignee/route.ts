import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    await db.execute(sql`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL
    `);
    return NextResponse.json({ ok: true, message: "assignee_id column added" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
