import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, tasks, sessions } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    const taskCounts = await db
      .select({
        userId: tasks.userId,
        total: count(),
      })
      .from(tasks)
      .groupBy(tasks.userId);

    const taskMap = new Map(taskCounts.map((r) => [r.userId, r.total]));

    const usersWithStats = allUsers.map((u) => ({
      ...u,
      taskCount: taskMap.get(u.id) || 0,
    }));

    return NextResponse.json({ users: usersWithStats });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
