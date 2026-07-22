import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { typingIndicators, conversationMembers, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const conversationId = request.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId обязателен" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const typing = await db
      .select({
        userId: typingIndicators.userId,
        userName: users.name,
        expiresAt: typingIndicators.expiresAt,
      })
      .from(typingIndicators)
      .innerJoin(users, eq(typingIndicators.userId, users.id))
      .where(
        and(
          eq(typingIndicators.conversationId, conversationId),
          gt(typingIndicators.expiresAt, now),
          eq(typingIndicators.userId, user.id) ? undefined : undefined
        )
      );

    const filtered = typing.filter((t) => t.userId !== user.id);
    return NextResponse.json(filtered);
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

    const body = await request.json();
    const { conversationId } = body;
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

    await db
      .delete(typingIndicators)
      .where(
        and(
          eq(typingIndicators.conversationId, conversationId),
          eq(typingIndicators.userId, user.id)
        )
      );

    const expiresAt = new Date(Date.now() + 5000).toISOString();
    await db.insert(typingIndicators).values({
      id: "ti_" + uuid().replace(/-/g, "").slice(0, 12),
      conversationId,
      userId: user.id,
      expiresAt,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
