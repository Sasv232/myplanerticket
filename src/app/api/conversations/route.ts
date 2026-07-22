import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, conversationMembers, messages, users } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const myMemberships = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, user.id));

    const convIds = myMemberships.map((m) => m.conversationId);
    if (convIds.length === 0) return NextResponse.json([]);

    const convos = await db.select().from(conversations).where(inArray(conversations.id, convIds));

    const allMembers = await db
      .select({
        conversationId: conversationMembers.conversationId,
        userId: conversationMembers.userId,
        userName: users.name,
        userAvatar: users.avatar,
        role: conversationMembers.role,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(inArray(conversationMembers.conversationId, convIds));

    const results = convos.map((conv) => ({
      ...conv,
      members: allMembers.filter((m) => m.conversationId === conv.id),
      lastMessage: null as any,
      unreadCount: 0,
    }));

    return NextResponse.json(results);
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
    const { type, name, emoji, memberIds } = body;

    if (type === "dm" && memberIds?.length === 1) {
      const myConvs = await db
        .select({ conversationId: conversationMembers.conversationId })
        .from(conversationMembers)
        .where(eq(conversationMembers.userId, user.id));

      for (const m of myConvs) {
        const otherMembers = await db
          .select()
          .from(conversationMembers)
          .where(
            and(
              eq(conversationMembers.conversationId, m.conversationId),
              eq(conversationMembers.userId, memberIds[0])
            )
          );
        if (otherMembers.length > 0) {
          const conv = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, m.conversationId))
            .limit(1);
          if (conv[0]?.type === "dm") {
            return NextResponse.json(conv[0]);
          }
        }
      }
    }

    const convId = "conv_" + uuid().replace(/-/g, "").slice(0, 12);
    const now = new Date().toISOString();

    await db.insert(conversations).values({
      id: convId,
      type: type || "dm",
      name: name || null,
      emoji: emoji || "💬",
      createdBy: user.id,
      createdAt: now,
    });

    await db.insert(conversationMembers).values({
      id: "cm_" + uuid().replace(/-/g, "").slice(0, 12),
      conversationId: convId,
      userId: user.id,
      role: "owner",
      joinedAt: now,
    });

    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== user.id) {
          await db.insert(conversationMembers).values({
            id: "cm_" + uuid().replace(/-/g, "").slice(0, 12),
            conversationId: convId,
            userId: memberId,
            role: "member",
            joinedAt: now,
          });
        }
      }
    }

    const conv = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
    return NextResponse.json(conv[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
