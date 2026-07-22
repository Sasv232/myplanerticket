"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus } from "@/types/task";
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
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Доска</h1>
        <p className="text-sm text-[var(--secondary)] mt-0.5">Перетаскивайте или нажмите кнопку</p>
      </div>

      <div className="p-5 space-y-6">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status}>
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-base font-semibold">{col.title}</h3>
                <span className="ml-auto rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--secondary)]">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div key={task.id} className="mobile-task-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate">{task.title}</p>
                        {task.description && (
                          <p className="mt-1.5 text-sm text-[var(--secondary)] line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2.5">
                          <Badge variant={priorityVariant[task.priority]} className="text-[10px] px-2.5 py-0.5">
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-xs text-[var(--secondary)]">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "d MMM", { locale: ru })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStatusChange(task.id, NEXT_STATUS[task.status])}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] active:scale-95 transition-all duration-150"
                        title={`Переместить в: ${columns.find(c => c.status === NEXT_STATUS[task.status])?.title}`}
                      >
                        <ArrowRight className="h-5 w-5 text-[var(--accent)]" />
                      </button>
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
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
