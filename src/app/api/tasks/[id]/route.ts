import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
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

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
    if (body.repeatRule !== undefined) updates.repeatRule = body.repeatRule || null;
    if (body.repeatAfterComplete !== undefined) updates.repeatAfterComplete = body.repeatAfterComplete;
    if (body.label !== undefined) updates.label = body.label || null;
    if (body.projectId !== undefined) updates.projectId = body.projectId || null;
    if (body.emoji !== undefined) updates.emoji = body.emoji || null;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt || null;

    await db.update(tasks).set(updates).where(eq(tasks.id, id));

    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
