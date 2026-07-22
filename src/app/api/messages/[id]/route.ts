import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, conversationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

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

    const msg = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    if (msg.length === 0) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (msg[0].userId !== user.id) {
      const member = await db
        .select()
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, msg[0].conversationId),
            eq(conversationMembers.userId, user.id)
          )
        );
      if (member.length === 0 || member[0].role !== "owner") {
        return NextResponse.json({ error: "Нет прав на удаление" }, { status: 403 });
      }
    }

    await db.delete(messages).where(eq(messages.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
