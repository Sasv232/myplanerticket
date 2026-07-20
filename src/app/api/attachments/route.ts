import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = uuid();

    const newAttachment = {
      id,
      taskId: body.taskId,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileType: body.fileType,
      fileData: body.fileData,
      createdAt: new Date().toISOString(),
    };

    await db.insert(attachments).values(newAttachment);
    return NextResponse.json({ id, fileName: body.fileName }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(attachments).where(eq(attachments.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function downloadAttachment(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
