import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";
import { getMemberProjectIds, isProjectMember, getAccessibleTasks } from "@/lib/project-utils";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("projectId");
    const allTasks = await getAccessibleTasks(user.id, projectId);
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

    if (body.projectId) {
      const isMember = await isProjectMember(body.projectId, user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Вы не участник проекта" }, { status: 403 });
      }
    }

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
      assigneeId: body.assigneeId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask);

    const [created] = await db.select({
      id: tasks.id,
      userId: tasks.userId,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      tags: tasks.tags,
      repeatRule: tasks.repeatRule,
      repeatAfterComplete: tasks.repeatAfterComplete,
      label: tasks.label,
      emoji: tasks.emoji,
      assigneeId: tasks.assigneeId,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assigneeName: users.name,
    }).from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.id, id))
      .limit(1);

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
