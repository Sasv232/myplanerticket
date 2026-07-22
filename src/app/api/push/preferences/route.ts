import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1);

    if (prefs.length === 0) {
      const id = "npref_" + uuid().replace(/-/g, "").slice(0, 12);
      await db.insert(notificationPreferences).values({ id, userId: user.id });
      const newPrefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, user.id))
        .limit(1);
      return NextResponse.json(newPrefs[0]);
    }

    return NextResponse.json(prefs[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const { messenger, deadlines, habits, serverErrors, maintenance, reminderTime } = body;

    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1);

    if (existing.length === 0) {
      const id = "npref_" + uuid().replace(/-/g, "").slice(0, 12);
      await db.insert(notificationPreferences).values({
        id,
        userId: user.id,
        messenger: messenger ?? true,
        deadlines: deadlines ?? true,
        habits: habits ?? true,
        serverErrors: serverErrors ?? true,
        maintenance: maintenance ?? true,
        reminderTime: reminderTime || "20:00",
      });
    } else {
      await db
        .update(notificationPreferences)
        .set({
          ...(messenger !== undefined && { messenger }),
          ...(deadlines !== undefined && { deadlines }),
          ...(habits !== undefined && { habits }),
          ...(serverErrors !== undefined && { serverErrors }),
          ...(maintenance !== undefined && { maintenance }),
          ...(reminderTime !== undefined && { reminderTime }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(notificationPreferences.userId, user.id));
    }

    const updated = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1);

    return NextResponse.json(updated[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
