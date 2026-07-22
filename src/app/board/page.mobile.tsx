"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
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

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export function BoardPageMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks?t=" + Date.now());
    const data = await res.json();
    setTasks(
      data.map((t: Task & { tags: string; repeat_rule: string | null }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
        repeatRule: t.repeat_rule || t.repeatRule || null,
      }))
    );
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  return (
    <div className="mobile-main">
      <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3">
        <h1 className="text-lg font-bold">Доска</h1>
        <p className="text-[11px] text-[var(--secondary)]">Перетаскивайте или нажмите кнопку</p>
      </div>

      <div className="p-4 space-y-4">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <span className="ml-auto rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--secondary)]">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <Card key={task.id} className="hover:border-[var(--accent)]/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
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
                        <button
                          onClick={() => handleStatusChange(task.id, NEXT_STATUS[task.status])}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] active:scale-95 transition-transform"
                          title={`Переместить в: ${columns.find(c => c.status === NEXT_STATUS[task.status])?.title}`}
                        >
                          <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--muted)]">
                    Нет задач
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
