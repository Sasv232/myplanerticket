"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus } from "@/types/task";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: "todo", title: "К выполнению", color: "var(--accent)" },
  { status: "in_progress", title: "В работе", color: "var(--warning)" },
  { status: "done", title: "Выполнено", color: "var(--success)" },
];

const priorityVariant: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
  urgent: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
};

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(
      data.map((t: Task & { tags: string }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
      }))
    );
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      handleStatusChange(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      <Header title="Доска" description="Перетаскивайте задачи между колонками" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
              onDrop={(e) => handleDrop(e, col.status)}
              onDragOver={handleDragOver}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <span className="ml-auto rounded-full bg-[var(--card)] px-2 py-0.5 text-xs text-[var(--secondary)]">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-grab active:cursor-grabbing hover:border-[var(--accent)]/30"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 text-[var(--muted)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.description && (
                            <p className="mt-1 text-xs text-[var(--secondary)] line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant={priorityVariant[task.priority]} className="text-[10px]">
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-[var(--secondary)]">
                                <Calendar className="h-2.5 w-2.5" />
                                {format(new Date(task.dueDate), "d MMM", { locale: ru })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--muted)]">
                    Перетащите задачу сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
