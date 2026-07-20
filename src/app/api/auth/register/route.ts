import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
