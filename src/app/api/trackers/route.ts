import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { trackers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    await ensureDb();
    const allTrackers = await db.select().from(trackers);
    return NextResponse.json(
      allTrackers.map((t) => ({
        ...t,
        config: JSON.parse(t.config),
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const id = uuid();

    const newTracker = {
      id,
      type: body.type,
      name: body.name,
      config: JSON.stringify(body.config || {}),
      isActive: body.isActive !== false,
      checkInterval: body.checkInterval || 3600,
    };

    await db.insert(trackers).values(newTracker);
    return NextResponse.json({ ...newTracker, config: body.config }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
