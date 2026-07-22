import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { karma } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(karma)
      .where(eq(karma.userId, user.id))
      .limit(1);

    if (rows.length === 0) {
      const id = "krm_" + uuid().replace(/-/g, "").slice(0, 12);
      const now = new Date().toISOString();
      const newKarma = {
        id,
        userId: user.id,
        points: 0,
        level: 1,
        streak: 0,
        lastActiveDate: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(karma).values(newKarma);
      return NextResponse.json(newKarma);
    }

    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
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
    const pointsToAdd = body.points || 0;

    const priorityPoints: Record<string, number> = {
      urgent: 10,
      high: 5,
      medium: 3,
      low: 1,
    };

    const actualPoints = body.priority
      ? priorityPoints[body.priority] || pointsToAdd
      : pointsToAdd;

    const rows = await db
      .select()
      .from(karma)
      .where(eq(karma.userId, user.id))
      .limit(1);

    if (rows.length === 0) {
      const id = "krm_" + uuid().replace(/-/g, "").slice(0, 12);
      const now = new Date().toISOString();
      const newKarma = {
        id,
        userId: user.id,
        points: actualPoints,
        level: Math.floor(actualPoints / 100) + 1,
        streak: 1,
        lastActiveDate: now.split("T")[0],
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(karma).values(newKarma);
      return NextResponse.json(newKarma, { status: 201 });
    }

    const existing = rows[0];
    const newPoints = existing.points + actualPoints;
    const newLevel = Math.floor(newPoints / 100) + 1;
    const today = new Date().toISOString().split("T")[0];

    let newStreak = existing.streak;
    if (existing.lastActiveDate !== today) {
      const lastDate = existing.lastActiveDate
        ? new Date(existing.lastActiveDate)
        : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastDate && existing.lastActiveDate === yesterdayStr) {
        newStreak = existing.streak + 1;
      } else if (existing.lastActiveDate !== today) {
        newStreak = 1;
      }
    }

    await db
      .update(karma)
      .set({
        points: newPoints,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: today,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(karma.id, existing.id));

    return NextResponse.json({
      id: existing.id,
      userId: user.id,
      points: newPoints,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: today,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
