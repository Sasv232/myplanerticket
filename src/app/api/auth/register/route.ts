import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    
    if (!checkRateLimit(`register:${ip}`, 5, 300000)) {
      return NextResponse.json({ error: "Слишком много регистраций. Подождите 5 минут." }, { status: 429 });
    }

    const body = await request.json();
    const { name, password, email } = body;

    if (!name || !password) {
      return NextResponse.json({ error: "Имя и пароль обязательны" }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "Пароль минимум 4 символа" }, { status: 400 });
    }

    const result = await register(name, password, email);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const response = NextResponse.json(result, { status: 201 });
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
  } catch (e: any) {
    console.error("Register error:", e?.message, e?.stack);
    return NextResponse.json({ error: "Ошибка сервера", detail: e?.message }, { status: 500 });
  }
}
