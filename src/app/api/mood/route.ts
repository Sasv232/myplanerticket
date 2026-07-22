import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dateParam = request.nextUrl.searchParams.get("date");
    const limitParam = request.nextUrl.searchParams.get("limit");

    let query = db.select().from(moodEntries).where(eq(moodEntries.userId, user.id)).orderBy(desc(moodEntries.date));

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      const rows = await db.select().from(moodEntries).where(eq(moodEntries.userId, user.id)).orderBy(desc(moodEntries.date)).limit(limit);
      return NextResponse.json(rows);
    }

    if (dateParam) {
      const rows = await db.select().from(moodEntries).where(and(eq(moodEntries.userId, user.id), eq(moodEntries.date, dateParam)));
      return NextResponse.json(rows);
    }

    const rows = await query;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const id = uuid();
    const now = new Date().toISOString();

    const newEntry = {
      id,
      userId: user.id,
      mood: body.mood,
      note: body.note || null,
      date: body.date || new Date().toISOString().split("T")[0],
      createdAt: now,
    };

    await db.insert(moodEntries).values(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await db.select().from(moodEntries).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, user.id))).limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(moodEntries).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, user.id)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
