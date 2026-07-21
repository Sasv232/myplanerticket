import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectInvites, projectMembers, projectActivity, projects } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code } = body;
  if (!code) return NextResponse.json({ error: "Введите код" }, { status: 400 });

  const [invite] = await db.select().from(projectInvites)
    .where(eq(projectInvites.code, code.toUpperCase()));
  if (!invite) return NextResponse.json({ error: "Неверный код приглашения" }, { status: 404 });
  if (!invite.projectId) return NextResponse.json({ error: "Неверный код" }, { status: 400 });

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Приглашение просрочено" }, { status: 400 });
  }

  if (invite.maxUses && (invite.uses || 0) >= invite.maxUses) {
    return NextResponse.json({ error: "Приглашение использовано" }, { status: 400 });
  }

  const [existing] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, invite.projectId), eq(projectMembers.userId, user.id)));
  if (existing) {
    return NextResponse.json({ error: "Вы уже в проекте" }, { status: 400 });
  }

  const now = new Date().toISOString();

  await db.insert(projectMembers).values({
    id: crypto.randomUUID(),
    projectId: invite.projectId,
    userId: user.id,
    role: invite.role,
    createdAt: now,
  });

  await db.update(projectInvites)
    .set({ uses: (invite.uses || 0) + 1 })
    .where(eq(projectInvites.id, invite.id));

  const [project] = await db.select().from(projects).where(eq(projects.id, invite.projectId));

  await db.insert(projectActivity).values({
    id: crypto.randomUUID(),
    projectId: invite.projectId,
    userId: user.id,
    action: "member_joined",
    details: `${user.name} присоединился к проекту`,
    createdAt: now,
  });

  return NextResponse.json({ ok: true, project });
}
