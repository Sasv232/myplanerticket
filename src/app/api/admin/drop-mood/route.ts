import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value || "";
    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    await db.execute(sql`DROP TABLE IF EXISTS mood_entries CASCADE`);
    
    return NextResponse.json({ success: true, message: "Таблица mood_entries удалена" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
