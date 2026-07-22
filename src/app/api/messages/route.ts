import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, conversationMembers, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const conversationId = request.nextUrl.searchParams.get("conversationId");
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 100);

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId обязателен" }, { status: 400 });
    }

    const member = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, user.id)
        )
      );
    if (member.length === 0) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        userId: messages.userId,
        content: messages.content,
        type: messages.type,
        replyTo: messages.replyTo,
        edited: messages.edited,
        createdAt: messages.createdAt,
        userName: users.name,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return NextResponse.json(rows.reverse());
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    if (!checkRateLimit(`msg:${user.id}`, 60, 60000)) {
      return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
    }

    const body = await request.json();
    const { conversationId, content, type, replyTo } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: "conversationId и content обязательны" }, { status: 400 });
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: "Сообщение слишком длинное" }, { status: 400 });
    }

    const member = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, user.id)
        )
      );
    if (member.length === 0) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const msgId = "msg_" + uuid().replace(/-/g, "").slice(0, 12);
    const now = new Date().toISOString();

    const newMsg = {
      id: msgId,
      conversationId,
      userId: user.id,
      content,
      type: type || "text",
      replyTo: replyTo || null,
      edited: false,
      createdAt: now,
    };

    await db.insert(messages).values(newMsg);

    return NextResponse.json({
      ...newMsg,
      userName: user.name,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
