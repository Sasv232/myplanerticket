import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { sendPushToUser, sendPushToAll } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, body: msgBody, url, tag } = body;
    if (!title || !msgBody) {
      return NextResponse.json({ error: "title и body обязательны" }, { status: 400 });
    }

    const payload = { title, body: msgBody, url, tag };

    if (userId === "all") {
      await sendPushToAll(payload);
    } else if (userId) {
      await sendPushToUser(userId, payload);
    } else {
      return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
