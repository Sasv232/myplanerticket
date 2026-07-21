import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { waterEntries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");

  if (date) {
    const rows = await db.select().from(waterEntries).where(and(eq(waterEntries.userId, user.id), eq(waterEntries.date, date))).orderBy(desc(waterEntries.createdAt));
    return NextResponse.json(rows);
  }

  const rows = await db.select().from(waterEntries).where(eq(waterEntries.userId, user.id)).orderBy(desc(waterEntries.createdAt));
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

  const [row] = await db.insert(waterEntries).values({
    id, userId: user.id, amount: body.amount, date: body.date, createdAt: now,
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

  await db.delete(waterEntries).where(and(eq(waterEntries.id, id), eq(waterEntries.userId, user.id)));
  return NextResponse.json({ ok: true });
}
