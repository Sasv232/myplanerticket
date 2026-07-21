import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectMembers, users, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function isProjectMember(projectId: string, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (project?.userId === userId) return true;
  const [member] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return !!member;
}

async function isProjectAdmin(projectId: string, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (project?.userId === userId) return true;
  const [member] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return !!member && member.role !== "member";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isProjectMember(id, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await db.select({
    id: projectMembers.id,
    role: projectMembers.role,
    userId: projectMembers.userId,
    userName: users.name,
    createdAt: projectMembers.createdAt,
  }).from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, id));

  return NextResponse.json(members);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isProjectAdmin(id, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "Missing memberId" }, { status: 400 });

  await db.delete(projectMembers).where(
    and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, id))
  );

  return NextResponse.json({ ok: true });
}
