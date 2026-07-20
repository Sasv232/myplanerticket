import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(trackers).where(eq(trackers.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.config !== undefined) updates.config = JSON.stringify(body.config);
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.checkInterval !== undefined) updates.checkInterval = body.checkInterval;

    await db.update(trackers).set(updates).where(eq(trackers.id, id));
    const rows = await db.select().from(trackers).where(eq(trackers.id, id)).limit(1);
    const updated = rows[0];

    return NextResponse.json({ ...updated, config: JSON.parse(updated?.config || "{}") });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
