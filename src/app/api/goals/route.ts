import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, user.id));

    return NextResponse.json(userGoals);
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
    const id = "goal_" + uuid().replace(/-/g, "").slice(0, 12);
    const now = new Date().toISOString();

    const newGoal = {
      id,
      userId: user.id,
      title: body.title,
      targetCount: body.targetCount || 10,
      currentCount: body.currentCount || 0,
      emoji: body.emoji || "🎯",
      resetPeriod: body.resetPeriod || "weekly",
      createdAt: now,
    };

    await db.insert(goals).values(newGoal);
    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const goal = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, body.id), eq(goals.userId, user.id)))
      .limit(1);

    if (goal.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const newCount = body.increment
      ? goal[0].currentCount + body.increment
      : body.currentCount ?? goal[0].currentCount;

    await db
      .update(goals)
      .set({
        title: body.title,
        targetCount: body.targetCount,
        currentCount: newCount,
        emoji: body.emoji,
        resetPeriod: body.resetPeriod,
      })
      .where(and(eq(goals.id, body.id), eq(goals.userId, user.id)));

    return NextResponse.json({ success: true, currentCount: newCount });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
