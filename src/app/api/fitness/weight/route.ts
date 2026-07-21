import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { weightEntries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");

  if (date) {
    const rows = await db.select().from(weightEntries).where(and(eq(weightEntries.userId, user.id), eq(weightEntries.date, date))).orderBy(desc(weightEntries.createdAt));
    return NextResponse.json(rows);
  }

  const rows = await db.select().from(weightEntries).where(eq(weightEntries.userId, user.id)).orderBy(desc(weightEntries.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const [row] = await db.insert(weightEntries).values({
    id, userId: user.id, weight: body.weight, date: body.date, createdAt: now,
  }).returning();

  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(weightEntries).where(and(eq(weightEntries.id, id), eq(weightEntries.userId, user.id)));
  return NextResponse.json({ ok: true });
}
