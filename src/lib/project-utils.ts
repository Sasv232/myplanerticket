import { db } from "./db";
import { tasks, projectMembers, projects, users } from "./db/schema";
import { eq, inArray, or, and } from "drizzle-orm";

export async function getMemberProjectIds(userId: string): Promise<string[]> {
  const memberRecords = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  const memberIds = memberRecords.map(r => r.projectId).filter(Boolean) as string[];

  const ownedProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));
  const ownedIds = ownedProjects.map(p => p.id);

  return [...new Set([...memberIds, ...ownedIds])];
}

export async function canAccessTask(taskId: string, userId: string): Promise<boolean> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) return false;
  if (task.userId === userId) return true;
  if (task.projectId) {
    const memberProjectIds = await getMemberProjectIds(userId);
    return memberProjectIds.includes(task.projectId);
  }
  return false;
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (project?.userId === userId) return true;
  const [member] = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return !!member;
}

export async function getProjectMemberIds(projectId: string): Promise<string[]> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  const memberRecords = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  const ids = memberRecords.map(r => r.userId).filter(Boolean) as string[];
  if (project?.userId && !ids.includes(project.userId)) {
    ids.push(project.userId);
  }
  return ids;
}

export async function getAccessibleTasks(userId: string, projectId?: string | null) {
  const memberProjectIds = await getMemberProjectIds(userId);

  const taskFields = {
    id: tasks.id,
    userId: tasks.userId,
    projectId: tasks.projectId,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    priority: tasks.priority,
    dueDate: tasks.dueDate,
    tags: tasks.tags,
    repeatRule: tasks.repeatRule,
    repeatAfterComplete: tasks.repeatAfterComplete,
    label: tasks.label,
    emoji: tasks.emoji,
    assigneeId: tasks.assigneeId,
    completedAt: tasks.completedAt,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
    assigneeName: users.name,
  };

  if (projectId) {
    if (!memberProjectIds.includes(projectId)) return [];
    return db.select(taskFields).from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.projectId, projectId));
  }

  const conditions = [eq(tasks.userId, userId)];
  if (memberProjectIds.length > 0) {
    conditions.push(inArray(tasks.projectId, memberProjectIds));
  }

  return db.select(taskFields).from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(or(...conditions));
}
