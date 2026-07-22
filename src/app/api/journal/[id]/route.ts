import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;

    const existing = await db.select().from(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id))).limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = { updatedAt: now };
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.mood !== undefined) updates.mood = body.mood;
    if (body.pinned !== undefined) updates.pinned = body.pinned;

    await db.update(journalEntries).set(updates).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id)));
    return NextResponse.json({ ok: true });
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
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;
    const existing = await db.select().from(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id))).limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
