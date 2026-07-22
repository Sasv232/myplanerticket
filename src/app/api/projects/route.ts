import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectMembers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id));

    const memberRecords = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, user.id));

    const memberProjectIds = memberRecords.map(r => r.projectId).filter(Boolean) as string[];

    let memberProjects: typeof ownedProjects = [];
    if (memberProjectIds.length > 0) {
      memberProjects = await db
        .select()
        .from(projects)
        .where(sql`${projects.id} IN (${sql.join(memberProjectIds.map(id => sql`${id}`), sql`, `)})`);
    }

    const allProjects = [...ownedProjects];
    const ownedIds = new Set(ownedProjects.map(p => p.id));
    for (const p of memberProjects) {
      if (!ownedIds.has(p.id)) {
        allProjects.push(p);
      }
    }

    return NextResponse.json(allProjects);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = await getUserFromToken(token || "");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = "proj_" + uuid().replace(/-/g, "").slice(0, 12);
    const now = new Date().toISOString();

    const newProject = {
      id,
      userId: user.id,
      name: body.name,
      emoji: body.emoji || "📁",
      color: body.color || "#3b82f6",
      createdAt: now,
    };

    await db.insert(projects).values(newProject);

    await db.insert(projectMembers).values({
      id: crypto.randomUUID(),
      projectId: id,
      userId: user.id,
      role: "owner",
      createdAt: now,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
