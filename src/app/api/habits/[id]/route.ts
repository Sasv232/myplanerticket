import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits, habitLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await db
      .update(habits)
      .set({
        name: body.name,
        emoji: body.emoji,
        color: body.color,
        frequency: body.frequency,
        targetCount: body.targetCount,
      })
      .where(and(eq(habits.id, id), eq(habits.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const today = body.date || new Date().toISOString().split("T")[0];
    const logId = "hl_" + uuid().replace(/-/g, "").slice(0, 12);

    const existing = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.date, today)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(habitLogs)
        .set({ count: existing[0].count + (body.count || 1) })
        .where(eq(habitLogs.id, existing[0].id));
      return NextResponse.json({ success: true, updated: true });
    }

    const newLog = {
      id: logId,
      habitId: id,
      date: today,
      count: body.count || 1,
      note: body.note || null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(habitLogs).values(newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
