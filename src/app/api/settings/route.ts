import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value || "";
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.NOTIFICATION_EMAIL),
      smtpUser: process.env.SMTP_USER || "",
      notificationEmail: process.env.NOTIFICATION_EMAIL || "",
      databaseConnected: true,
      parsersAvailable: ["rzd"],
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value || "";
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      ok: true,
      message: "Настройки SMTP задаются через переменные окружения Vercel (SMTP_USER, SMTP_PASS, NOTIFICATION_EMAIL)",
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
