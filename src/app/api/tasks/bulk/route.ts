import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, value } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (action === "status") updates.status = value;
    else if (action === "priority") updates.priority = value;
    else if (action === "delete") {
      await db.delete(tasks).where(inArray(tasks.id, ids));
      return NextResponse.json({ ok: true, deleted: ids.length });
    }
    else if (action === "label") updates.label = value || null;
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.update(tasks).set(updates).where(inArray(tasks.id, ids));
    return NextResponse.json({ ok: true, updated: ids.length });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
