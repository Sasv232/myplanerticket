import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
