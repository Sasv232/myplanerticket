import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    await db.update(tasks).set(updates).where(eq(tasks.id, id));

    // Auto-create next recurring task when status changes to "done"
    if (body.status === "done") {
      const rows2 = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      const completedTask = rows2[0];
      if (completedTask?.repeatRule) {
        const nextDueDate = completedTask.dueDate
          ? getNextDueDate(completedTask.dueDate, completedTask.repeatRule)
          : null;
        const newTask = {
          id: uuid(),
          userId: completedTask.userId,
          projectId: completedTask.projectId,
          title: completedTask.title,
          description: completedTask.description,
          status: "todo" as const,
          priority: completedTask.priority,
          dueDate: nextDueDate,
          tags: completedTask.tags,
          repeatRule: completedTask.repeatRule,
          repeatAfterComplete: completedTask.repeatAfterComplete,
          label: completedTask.label,
          emoji: completedTask.emoji,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.insert(tasks).values(newTask);
      }
    }

    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
