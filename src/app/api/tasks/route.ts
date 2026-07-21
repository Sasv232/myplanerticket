import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("projectId");
    let query = db.select().from(tasks).where(eq(tasks.userId, user.id));

    if (projectId) {
      const allTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
      const filtered = allTasks.filter(t => t.projectId === projectId);
      return NextResponse.json(filtered);
    }

    const allTasks = await query;
    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const id = uuid();
    const now = new Date().toISOString();

    const newTask = {
      id,
      userId: user.id,
      projectId: body.projectId || null,
      title: body.title,
      description: body.description || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      dueDate: body.dueDate || null,
      tags: JSON.stringify(body.tags || []),
      repeatRule: body.repeatRule || null,
      repeatAfterComplete: body.repeatAfterComplete || false,
      label: body.label || null,
      emoji: body.emoji || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
