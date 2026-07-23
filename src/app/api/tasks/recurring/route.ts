import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects, projectMembers } from "@/lib/db/schema";
import { eq, inArray, or } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

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

async function canAccessTask(taskId: string, userId: string): Promise<boolean> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) return false;
  if (task.userId === userId) return true;
  if (task.projectId) {
    const memberProjectIds = await getMemberProjectIds(userId);
    return memberProjectIds.includes(task.projectId);
  }
  return false;
}

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
      while (next.getDay() === 0 || next.getDay() === 6) {
        next = addDays(next, 1);
      }
      return format(next, "yyyy-MM-dd");
    }
    case "weekends": {
      let next = addDays(date, 1);
      while (next.getDay() !== 0 && next.getDay() !== 6) {
        next = addDays(next, 1);
      }
      return format(next, "yyyy-MM-dd");
    }
    default: return format(addDays(date, 1), "yyyy-MM-dd");
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { getUserFromToken } = await import("@/lib/auth");
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { taskId } = await request.json();
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const allowed = await canAccessTask(taskId, user.id);
    if (!allowed) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const rows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "Task not found" }, { status: 404 });

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(tasks).values(newTask);
    return NextResponse.json({ ok: true, task: newTask });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// Auto-process: check for overdue recurring tasks and create new instances
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { getUserFromToken } = await import("@/lib/auth");
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberProjectIds = await getMemberProjectIds(user.id);
    const allTasks = await db.select().from(tasks).where(
      or(
        eq(tasks.userId, user.id),
        memberProjectIds.length > 0 ? inArray(tasks.projectId, memberProjectIds) : undefined
      )
    );
    const recurringTasks = allTasks.filter(
      (t) => t.repeatRule && t.status === "done" && t.repeatAfterComplete
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
