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

    const queries = [
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'svc_react') THEN
          CREATE POLICY svc_react ON message_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
      END $$`,
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_react') THEN
          CREATE POLICY anon_react ON message_reactions FOR ALL TO anon USING (false);
        END IF;
      END $$`,
    ];

    const results: string[] = [];
    for (const q of queries) {
      try {
        await db.execute(sql.raw(q));
        results.push("✓");
      } catch (e: any) {
        results.push(`err: ${e.message?.slice(0, 80)}`);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
