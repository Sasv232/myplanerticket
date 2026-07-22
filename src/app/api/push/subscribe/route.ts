import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const { endpoint, p256dh, auth } = body;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Невалидная подписка" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ ok: true, message: "Подписка уже существует" });
    }

    const id = "push_" + uuid().replace(/-/g, "").slice(0, 12);
    await db.insert(pushSubscriptions).values({
      id,
      userId: user.id,
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
