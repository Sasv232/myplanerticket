import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    
    if (!checkRateLimit(`login:${ip}`, 10, 60000)) {
      return NextResponse.json({ error: "Слишком много попыток. Подождите минуту." }, { status: 429 });
    }

    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json({ error: "Имя и пароль обязательны" }, { status: 400 });
    }

    const result = await login(name, password);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json(result);
    if (result.token) {
      response.cookies.set("session_token", result.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
