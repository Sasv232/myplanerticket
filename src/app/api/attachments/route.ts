import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/markdown",
  "application/zip",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const rows = await db
      .select({
        id: attachments.id,
        taskId: attachments.taskId,
        fileName: attachments.fileName,
        fileSize: attachments.fileSize,
        fileType: attachments.fileType,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.taskId, taskId));

    return NextResponse.json(rows);
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
    const { taskId, fileName, fileSize, fileType, fileData } = body;

    if (!taskId || !fileName || !fileType || !fileData) {
      return NextResponse.json({ error: "Обязательные поля отсутствуют" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json({ error: "Тип файла не разрешён" }, { status: 400 });
    }

    const decoded = Buffer.from(fileData, "base64");
    if (decoded.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой (макс. 10MB)" }, { status: 400 });
    }

    const id = uuid();
    const newAttachment = {
      id,
      taskId,
      fileName,
      fileSize: fileSize || decoded.length,
      fileType,
      fileData,
      createdAt: new Date().toISOString(),
    };

    await db.insert(attachments).values(newAttachment);
    return NextResponse.json({ id, fileName }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(attachments).where(eq(attachments.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
