import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, comments, attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const allTasks = await db.select().from(tasks);

    const tasksWithExtras = await Promise.all(
      allTasks.map(async (task) => {
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tasksData = body.tasks || [];

    let imported = 0;
    for (const task of tasksData) {
      const { comments: taskComments, attachments: taskAttachments, ...taskData } = task;
      await db.insert(tasks).values({
        id: taskData.id,
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
            userId: c.userId || null,
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
