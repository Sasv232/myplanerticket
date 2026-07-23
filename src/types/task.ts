export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  userId?: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  repeatRule: string | null;
  repeatAfterComplete: boolean;
  label: string | null;
  emoji: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  repeatRule?: string;
  repeatAfterComplete?: boolean;
  label?: string;
  projectId?: string;
  emoji?: string;
  assigneeId?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completedAt?: string | null;
}
