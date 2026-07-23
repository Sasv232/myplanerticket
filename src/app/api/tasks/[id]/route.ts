import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";
import { getUserFromToken } from "@/lib/auth";
import { canAccessTask } from "@/lib/project-utils";

function getNextDueDate(currentDueDate: string, repeatRule: string): string {
  const date = new Date(currentDueDate);
  switch (repeatRule) {
    case "daily": return format(addDays(date, 1), "yyyy-MM-dd");
    case "weekly": return format(addWeeks(date, 1), "yyyy-MM-dd");
    case "biweekly": return format(addWeeks(date, 2), "yyyy-MM-dd");
    case "monthly": return format(addMonths(date, 1), "yyyy-MM-dd");
    case "yearly": return format(addYears(date, 1), "yyyy-MM-dd");
    case "weekdays": {
      let next = addDays(date, 1);
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1);
      return format(next, "yyyy-MM-dd");
    }
    case "weekends": {
      let next = addDays(date, 1);
      while (next.getDay() !== 0 && next.getDay() !== 6) next = addDays(next, 1);
      return format(next, "yyyy-MM-dd");
    }
    default: return format(addDays(date, 1), "yyyy-MM-dd");
  }
}

const taskFields = {
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
};

async function getTaskWithAssignee(taskId: string) {
  const rows = await db.select(taskFields).from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.id, taskId))
    .limit(1);
  return rows[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;
    const allowed = await canAccessTask(id, user.id);
    if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const task = await getTaskWithAssignee(id);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

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
    const allowed = await canAccessTask(id, user.id);
    if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
    if (body.repeatRule !== undefined) updates.repeatRule = body.repeatRule || null;
    if (body.repeatAfterComplete !== undefined) updates.repeatAfterComplete = body.repeatAfterComplete;
    if (body.label !== undefined) updates.label = body.label || null;
    if (body.projectId !== undefined) updates.projectId = body.projectId || null;
    if (body.emoji !== undefined) updates.emoji = body.emoji || null;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt || null;
    if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId || null;

    await db.update(tasks).set(updates).where(eq(tasks.id, id));

    if (body.status === "done") {
      const [completedTask] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      if (completedTask?.repeatRule) {
        const nextDueDate = completedTask.dueDate
          ? getNextDueDate(completedTask.dueDate, completedTask.repeatRule)
          : null;
        await db.insert(tasks).values({
          id: uuid(),
          userId: completedTask.userId,
          projectId: completedTask.projectId,
          title: completedTask.title,
          description: completedTask.description,
          status: "todo",
          priority: completedTask.priority,
          dueDate: nextDueDate,
          tags: completedTask.tags,
          repeatRule: completedTask.repeatRule,
          repeatAfterComplete: completedTask.repeatAfterComplete,
          label: completedTask.label,
          emoji: completedTask.emoji,
          assigneeId: completedTask.assigneeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const updated = await getTaskWithAssignee(id);
    return NextResponse.json(updated);
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
    const allowed = await canAccessTask(id, user.id);
    if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
