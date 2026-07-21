import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const allNotes = await db.select().from(notes).where(eq(notes.userId, user.id));
    return NextResponse.json(allNotes);
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

    const newNote = {
      id,
      userId: user.id,
      title: body.title || null,
      content: body.content,
      color: body.color || "#e0e7ff",
      pinned: body.pinned || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(notes).values(newNote);
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
