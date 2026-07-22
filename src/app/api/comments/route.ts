import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, users, userMentions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const rows = await db
      .select({
        id: comments.id,
        taskId: comments.taskId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        userName: users.name,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    let currentUserId: string | null = null;
    if (token) {
      const user = await getUserFromToken(token);
      currentUserId = user?.id || null;
    }

    const body = await request.json();
    const id = uuid();

    const newComment = {
      id,
      taskId: body.taskId,
      userId: body.userId || currentUserId,
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    await db.insert(comments).values(newComment);

    // Detect @mentions
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentionedNames: string[] = [];
    while ((match = mentionRegex.exec(body.content)) !== null) {
      mentionedNames.push(match[1]);
    }

    if (mentionedNames.length > 0 && body.taskId) {
      const allUsers = await db.select({ id: users.id, name: users.name }).from(users);
      for (const name of mentionedNames) {
        const found = allUsers.find(
          (u) => u.name && u.name.toLowerCase() === name.toLowerCase()
        );
        if (found && found.id !== currentUserId) {
          await db.insert(userMentions).values({
            id: uuid(),
            commentId: id,
            mentionedUserId: found.id,
            fromUserId: currentUserId,
            taskId: body.taskId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(comments).where(eq(comments.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// GET mentions for current user
export async function PATCH(request: NextRequest) {
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
