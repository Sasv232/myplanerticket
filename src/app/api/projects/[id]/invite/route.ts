import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, projectInvites, projects, projectActivity } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, user.id)));
  if (!member || member.role === "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const inviteId = crypto.randomUUID();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const now = new Date().toISOString();

  const [invite] = await db.insert(projectInvites).values({
    id: inviteId, projectId: id, code,
    role: body.role || "member",
    maxUses: body.maxUses || null,
    expiresAt: body.expiresAt || null,
    createdAt: now,
  }).returning();

  await db.insert(projectActivity).values({
    id: crypto.randomUUID(), projectId: id, userId: user.id,
    action: "invite_created", details: `Invite code: ${code}`,
    createdAt: now,
  });

  return NextResponse.json(invite);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, user.id)));
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invites = await db.select().from(projectInvites)
    .where(eq(projectInvites.projectId, id));

  return NextResponse.json(invites);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const inviteId = url.searchParams.get("inviteId");
  if (!inviteId) return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });

  await db.delete(projectInvites).where(
    and(eq(projectInvites.id, inviteId), eq(projectInvites.projectId, id))
  );

  return NextResponse.json({ ok: true });
}
