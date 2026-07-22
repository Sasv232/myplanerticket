import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userMentions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select({
        id: userMentions.id,
        commentId: userMentions.commentId,
        fromUserId: userMentions.fromUserId,
        taskId: userMentions.taskId,
        read: userMentions.read,
        createdAt: userMentions.createdAt,
        fromUserName: users.name,
      })
      .from(userMentions)
      .leftJoin(users, eq(userMentions.fromUserId, users.id))
      .where(eq(userMentions.mentionedUserId, user.id))
      .orderBy(desc(userMentions.createdAt))
      .limit(20);

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (body.markAllRead) {
      await db.update(userMentions).set({ read: true }).where(eq(userMentions.mentionedUserId, user.id));
    } else if (body.id) {
      await db.update(userMentions).set({ read: true }).where(eq(userMentions.id, body.id));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
