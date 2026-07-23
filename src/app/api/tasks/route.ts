import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projectMembers, projects } from "@/lib/db/schema";
import { eq, inArray, or, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
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
  const ownedIds = ownedProjects.map(p => p.id);

  return [...new Set([...projectIds, ...ownedIds])];
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("projectId");
    const memberProjectIds = await getMemberProjectIds(user.id);

    if (projectId) {
      if (!memberProjectIds.includes(projectId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const allTasks = await db.select().from(tasks).where(
        and(
          eq(tasks.projectId, projectId),
          inArray(tasks.userId, memberProjectIds)
        )
      );
      return NextResponse.json(allTasks);
    }

    const allTasks = await db.select().from(tasks).where(
      or(
        eq(tasks.userId, user.id),
        memberProjectIds.length > 0 ? inArray(tasks.projectId, memberProjectIds) : undefined
      )
    );
    return NextResponse.json(allTasks);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const id = uuid();
    const now = new Date().toISOString();

    const newTask = {
      id,
      userId: user.id,
      projectId: body.projectId || null,
      title: body.title,
      description: body.description || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      dueDate: body.dueDate || null,
      tags: JSON.stringify(body.tags || []),
      repeatRule: body.repeatRule || null,
      repeatAfterComplete: body.repeatAfterComplete || false,
      label: body.label || null,
      emoji: body.emoji || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
