import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeEntries } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const rows = await db.select().from(timeEntries).where(eq(timeEntries.taskId, taskId));
    const total = rows.reduce((acc, r) => acc + r.duration, 0);

    return NextResponse.json({ entries: rows, totalMinutes: total });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuid();

    const entry = {
      id,
      taskId: body.taskId,
      duration: body.duration,
      note: body.note || null,
      startedAt: body.startedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.insert(timeEntries).values(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
