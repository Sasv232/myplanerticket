import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = _request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;
    const rows = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);

    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const att = rows[0];
    const buffer = Buffer.from(att.fileData, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": att.fileType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(att.fileName)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
