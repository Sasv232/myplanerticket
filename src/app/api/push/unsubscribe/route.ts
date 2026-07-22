import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      await db.delete(pushSubscriptions).where(
        and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint))
      );
    } else {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
