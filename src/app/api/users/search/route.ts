import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q") || "";
    
    if (q.length < 1) {
      return NextResponse.json([]);
    }

    const results = await db.execute(
      sql`SELECT id, name FROM users WHERE id != ${user.id} AND name ILIKE ${"%" + q + "%"} LIMIT 20`
    );

    return NextResponse.json(results.rows);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
