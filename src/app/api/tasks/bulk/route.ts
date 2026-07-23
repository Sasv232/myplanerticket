import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects, projectMembers } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

async function getMemberProjectIds(userId: string): Promise<string[]> {
  const memberRecords = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  const projectIds = memberRecords.map(r => r.projectId).filter(Boolean) as string[];
  const ownedProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));
  return [...new Set([...projectIds, ...ownedProjects.map(p => p.id)])];
}

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

    const memberProjectIds = await getMemberProjectIds(user.id);

    const allTasks = await db.select({ id: tasks.id, projectId: tasks.projectId, userId: tasks.userId })
      .from(tasks)
      .where(inArray(tasks.id, ids));
    
    const accessible = allTasks.filter(t =>
      t.userId === user.id || (t.projectId && memberProjectIds.includes(t.projectId))
    );
    const accessibleIds = accessible.map(r => r.id);
    if (accessibleIds.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (action === "status") updates.status = value;
    else if (action === "priority") updates.priority = value;
    else if (action === "delete") {
      await db.delete(tasks).where(inArray(tasks.id, accessibleIds));
      return NextResponse.json({ ok: true, deleted: accessibleIds.length });
    }
    else if (action === "label") updates.label = value || null;
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.update(tasks).set(updates).where(inArray(tasks.id, accessibleIds));
    return NextResponse.json({ ok: true, updated: accessibleIds.length });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
