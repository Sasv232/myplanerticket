import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectActivity, projectMembers, projects, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  const isOwner = project?.userId === user.id;

  if (!isOwner) {
    const [member] = await db.select().from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, user.id)));
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activities = await db.select({
    id: projectActivity.id,
    action: projectActivity.action,
    details: projectActivity.details,
    userId: projectActivity.userId,
    userName: users.name,
    createdAt: projectActivity.createdAt,
  }).from(projectActivity)
    .innerJoin(users, eq(projectActivity.userId, users.id))
    .where(eq(projectActivity.projectId, id))
    .orderBy(desc(projectActivity.createdAt))
    .limit(50);

  return NextResponse.json(activities);
}
