import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, comments, attachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));

    const tasksWithExtras = await Promise.all(
      userTasks.map(async (task) => {
        const taskComments = await db
          .select()
          .from(comments)
          .where(eq(comments.taskId, task.id));
        const taskAttachments = await db
          .select({
            id: attachments.id,
            taskId: attachments.taskId,
            fileName: attachments.fileName,
            fileSize: attachments.fileSize,
            fileType: attachments.fileType,
            fileData: attachments.fileData,
            createdAt: attachments.createdAt,
          })
          .from(attachments)
          .where(eq(attachments.taskId, task.id));
        return { ...task, comments: taskComments, attachments: taskAttachments };
      })
    );

    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: tasksWithExtras,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const tasksData = body.tasks || [];

    let imported = 0;
    for (const task of tasksData) {
      const { comments: taskComments, attachments: taskAttachments, ...taskData } = task;
      await db.insert(tasks).values({
        id: taskData.id,
        userId: user.id,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate || null,
        tags: typeof taskData.tags === "string" ? taskData.tags : JSON.stringify(taskData.tags || []),
        repeatRule: taskData.repeatRule || null,
        createdAt: taskData.createdAt || new Date().toISOString(),
        updatedAt: taskData.updatedAt || new Date().toISOString(),
      }).onConflictDoNothing();

      if (taskComments) {
        for (const c of taskComments) {
          await db.insert(comments).values({
            id: c.id,
            taskId: c.taskId,
            userId: user.id,
            content: c.content,
            createdAt: c.createdAt,
          }).onConflictDoNothing();
        }
      }

      if (taskAttachments) {
        for (const a of taskAttachments) {
          await db.insert(attachments).values({
            id: a.id,
            taskId: a.taskId,
            fileName: a.fileName,
            fileSize: a.fileSize,
            fileType: a.fileType,
            fileData: a.fileData,
            createdAt: a.createdAt,
          }).onConflictDoNothing();
        }
      }

      imported++;
    }

    return NextResponse.json({ ok: true, imported });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
