import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits, habitLogs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, user.id));

    const allLogs = await db
      .select()
      .from(habitLogs)
      .innerJoin(habits, eq(habitLogs.habitId, habits.id))
      .where(eq(habits.userId, user.id));

    const habitsWithLogs = userHabits.map((habit) => ({
      ...habit,
      logs: allLogs
        .filter((log) => log.habit_logs.habitId === habit.id)
        .map((log) => ({
          id: log.habit_logs.id,
          habitId: log.habit_logs.habitId,
          date: log.habit_logs.date,
          count: log.habit_logs.count,
          note: log.habit_logs.note,
        })),
    }));

    return NextResponse.json(habitsWithLogs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = "hab_" + uuid().replace(/-/g, "").slice(0, 12);
    const now = new Date().toISOString();

    const newHabit = {
      id,
      userId: user.id,
      name: body.name,
      emoji: body.emoji || "✅",
      color: body.color || "#22c55e",
      frequency: body.frequency || "daily",
      targetCount: body.targetCount || 1,
      createdAt: now,
    };

    await db.insert(habits).values(newHabit);
    return NextResponse.json({ ...newHabit, logs: [] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
