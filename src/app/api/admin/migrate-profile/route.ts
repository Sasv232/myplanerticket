import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const migrations = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`,
    ];

    let ok = 0;
    for (const m of migrations) {
      try {
        await db.execute(sql.raw(m));
        ok++;
      } catch {}
    }

    return NextResponse.json({ ok: true, applied: ok });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
