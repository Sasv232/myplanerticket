import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";
import { canAccessTask } from "@/lib/project-utils";

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

    const accessibleIds: string[] = [];
    for (const id of ids) {
      if (await canAccessTask(id, user.id)) {
        accessibleIds.push(id);
      }
    }
    if (accessibleIds.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (action === "status") updates.status = value;
    else if (action === "priority") updates.priority = value;
    else if (action === "delete") {
      await db.delete(tasks).where(inArray(tasks.id, accessibleIds));
      return NextResponse.json({ ok: true, deleted: accessibleIds.length });
    }
    else if (action === "label") updates.label = value || null;
    else if (action === "assignee") updates.assigneeId = value || null;
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.update(tasks).set(updates).where(inArray(tasks.id, accessibleIds));
    return NextResponse.json({ ok: true, updated: accessibleIds.length });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
