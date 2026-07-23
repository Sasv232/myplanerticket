import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";
import { getUserFromToken } from "@/lib/auth";
import { canAccessTask, getAccessibleTasks } from "@/lib/project-utils";

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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { getUserFromToken: getU } = await import("@/lib/auth");
    const user = await getU(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { taskId } = await request.json();
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const allowed = await canAccessTask(taskId, user.id);
    if (!allowed) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const rows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    const task = rows[0];
    if (!task.repeatRule) return NextResponse.json({ ok: false, message: "No repeat rule" });

    const nextDueDate = task.dueDate ? getNextDueDate(task.dueDate, task.repeatRule) : null;

    const newTask = {
      id: uuid(),
      userId: task.userId,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: "todo" as const,
      priority: task.priority,
      dueDate: nextDueDate,
      tags: task.tags,
      repeatRule: task.repeatRule,
      repeatAfterComplete: task.repeatAfterComplete,
      label: task.label,
      emoji: task.emoji,
      assigneeId: task.assigneeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(tasks).values(newTask);
    return NextResponse.json({ ok: true, task: newTask });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { getUserFromToken } = await import("@/lib/auth");
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allTasks = await getAccessibleTasks(user.id);
    const recurringTasks = (allTasks as any[]).filter(
      (t: any) => t.repeatRule && t.status === "done" && t.repeatAfterComplete
    );

    const created = [];
    for (const task of recurringTasks) {
      const nextDueDate = task.dueDate ? getNextDueDate(task.dueDate, task.repeatRule!) : null;
      const newTask = {
        id: uuid(),
        userId: task.userId,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: "todo" as const,
        priority: task.priority,
        dueDate: nextDueDate,
        tags: task.tags,
        repeatRule: task.repeatRule,
        repeatAfterComplete: task.repeatAfterComplete,
        label: task.label,
        emoji: task.emoji,
        assigneeId: task.assigneeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert(tasks).values(newTask);
      created.push(newTask);
    }

    return NextResponse.json({ created: created.length });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
