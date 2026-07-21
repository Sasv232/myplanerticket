import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { healthProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db.select().from(healthProfile).where(eq(healthProfile.userId, user.id));
  return NextResponse.json(row || null);
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const now = new Date().toISOString();

  const [existing] = await db.select().from(healthProfile).where(eq(healthProfile.userId, user.id));

  if (existing) {
    const [row] = await db.update(healthProfile)
      .set({ ...body, updatedAt: now })
      .where(eq(healthProfile.userId, user.id))
      .returning();
    return NextResponse.json(row);
  } else {
    const id = crypto.randomUUID();
    const [row] = await db.insert(healthProfile).values({
      id, userId: user.id, height: body.height, birthDate: body.birthDate,
      gender: body.gender, activityLevel: body.activityLevel,
      dailyCalorieGoal: body.dailyCalorieGoal, dailyWaterGoal: body.dailyWaterGoal,
      createdAt: now, updatedAt: now,
    }).returning();
    return NextResponse.json(row);
  }
}
