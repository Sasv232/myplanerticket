import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { inArray, eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const { ids, action, value } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const owned = await db.select({ id: tasks.id }).from(tasks).where(and(inArray(tasks.id, ids), eq(tasks.userId, user.id)));
    const ownedIds = owned.map(r => r.id);
    if (ownedIds.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (action === "status") updates.status = value;
    else if (action === "priority") updates.priority = value;
    else if (action === "delete") {
      await db.delete(tasks).where(inArray(tasks.id, ownedIds));
      return NextResponse.json({ ok: true, deleted: ownedIds.length });
    }
    else if (action === "label") updates.label = value || null;
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.update(tasks).set(updates).where(inArray(tasks.id, ownedIds));
    return NextResponse.json({ ok: true, updated: ownedIds.length });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
