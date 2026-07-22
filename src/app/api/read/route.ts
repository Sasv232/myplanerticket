import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

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

    const now = new Date().toISOString();
    await db
      .update(conversationMembers)
      .set({ lastReadAt: now })
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, user.id)
        )
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
