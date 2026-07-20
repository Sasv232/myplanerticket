import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value || "";
    if (token) {
      await logout(token);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("session_token", "", { expires: new Date(0), path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
