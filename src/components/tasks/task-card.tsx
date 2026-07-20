"use client";

import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; variant: "destructive" | "warning" | "default" | "secondary" }> = {
  urgent: { label: "Срочно", variant: "destructive" },
  high: { label: "Высокий", variant: "warning" },
  medium: { label: "Средний", variant: "default" },
  low: { label: "Низкий", variant: "secondary" },
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Выполнено",
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const priority = priorityConfig[task.priority];

  return (
    <Card className="group p-4 hover:border-[var(--accent)]/30">
      <div className="flex items-start gap-3">
        <GripVertical className="mt-1 h-4 w-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{task.title}</h3>
            <Badge variant={priority.variant}>{priority.label}</Badge>
          </div>
          {task.description && (
            <p className="text-sm text-[var(--secondary)] line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-[var(--secondary)]">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "d MMM", { locale: ru })}
              </span>
            )}
            {task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-[var(--surface)] px-1.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--error)]" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
