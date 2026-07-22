import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits, habitLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const hour = now.getHours();

    const allHabits = await db.select().from(habits).where(eq(habits.frequency, "daily"));

    let sent = 0;

    for (const habit of allHabits) {
      const todayLogs = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, habit.id),
            eq(habitLogs.date, today)
          )
        );

      const totalDone = todayLogs.reduce((sum, log) => sum + log.count, 0);

      if (totalDone < habit.targetCount && habit.userId) {
        await sendPushToUser(habit.userId, {
          title: "Напоминание о привычке",
          body: `Не забудьте: ${habit.emoji || "✅"} ${habit.name}`,
          url: "/habits",
          tag: "habit",
        });
        sent++;
      }
    }

    return NextResponse.json({ ok: true, checked: allHabits.length, sent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
