import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    await ensureDb();
    const allTasks = await db.select().from(tasks);
    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const id = uuid();
    const now = new Date().toISOString();

    const newTask = {
      id,
      title: body.title,
      description: body.description || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      dueDate: body.dueDate || null,
      tags: JSON.stringify(body.tags || []),
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
