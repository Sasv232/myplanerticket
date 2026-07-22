import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, conversationMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

async function isMember(conversationId: string, userId: string) {
  const rows = await db
    .select()
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId)
      )
    );
  return rows.length > 0 ? rows[0] : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const member = await isMember(id, user.id);
    if (!member) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

    const conv = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (conv.length === 0) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    const members = await db
      .select({
        userId: conversationMembers.userId,
        userName: users.name,
        role: conversationMembers.role,
        lastReadAt: conversationMembers.lastReadAt,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(eq(conversationMembers.conversationId, id));

    return NextResponse.json({ ...conv[0], members });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const member = await isMember(id, user.id);
    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Только владелец может удалить чат" }, { status: 403 });
    }

    await db.delete(conversations).where(eq(conversations.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
