import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq, and, lte, isNull } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

    const upcomingTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        userId: tasks.userId,
        status: tasks.status,
      })
      .from(tasks)
      .where(
        and(
          lte(tasks.dueDate, tomorrow),
          eq(tasks.status, "todo"),
        )
      );

    let sent = 0;
    const notified = new Set<string>();

    for (const task of upcomingTasks) {
      if (!task.dueDate || notified.has(`${task.userId}-${task.dueDate}`)) continue;

      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < now;
      const isToday = task.dueDate === today;
      const isTomorrow = task.dueDate === tomorrow;

      let title = "";
      let body = "";

      if (isOverdue) {
        title = "Просроченная задача";
        body = `"${task.title}" — срок истёк`;
      } else if (isToday) {
        title = "Дедлайн сегодня";
        body = `"${task.title}" — нужно完成ить сегодня`;
      } else if (isTomorrow) {
        title = "Дедлайн завтра";
        body = `"${task.title}" — срок завтра`;
      }

      if (title && task.userId) {
        await sendPushToUser(task.userId, {
          title,
          body,
          url: "/tasks",
          tag: "deadline",
        });
        notified.add(`${task.userId}-${task.dueDate}`);
        sent++;
      }
    }

    return NextResponse.json({ ok: true, checked: upcomingTasks.length, sent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
