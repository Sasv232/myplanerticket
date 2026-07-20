"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  ListTodo,
  AlertTriangle,
  Train,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(
        data.map((t: Task & { tags: string }) => ({
          ...t,
          tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
        }))
      );
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = {
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
  };

  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div>
      <Header title="Дашборд" description="Обзор ваших задач и трекеров" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="hover:border-[var(--accent)]/30 transition-colors">
          <Link href="/tasks">
            <CardContent className="flex items-center gap-3 p-4">
              <ListTodo className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-2xl font-bold">{stats.todo}</p>
                <p className="text-xs text-[var(--secondary)]">К выполнению</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:border-[var(--warning)]/30 transition-colors">
          <Link href="/tasks">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-[var(--warning)]" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-[var(--secondary)]">В работе</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:border-[var(--success)]/30 transition-colors">
          <Link href="/tasks">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-[var(--success)]" />
              <div>
                <p className="text-2xl font-bold">{stats.done}</p>
                <p className="text-xs text-[var(--secondary)]">Выполнено</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:border-[var(--error)]/30 transition-colors">
          <Link href="/tasks">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-[var(--error)]" />
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-[var(--secondary)]">Срочных</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              Ближайшие дедлайны
              <Link href="/tasks" className="text-xs text-[var(--accent)] hover:underline">
                Все задачи →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-[var(--secondary)]">Нет задач с дедлайнами</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-[var(--secondary)]">
                        {new Date(task.dueDate!).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        task.priority === "urgent"
                          ? "destructive"
                          : task.priority === "high"
                          ? "warning"
                          : "default"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Быстрый доступ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/trackers/rzd"
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent)]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Train className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium">Найти билеты</p>
                  <p className="text-xs text-[var(--secondary)]">РЖД поиск</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--secondary)]" />
            </Link>
            <Link
              href="/board"
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent)]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ListTodo className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium">Доска задач</p>
                  <p className="text-xs text-[var(--secondary)]">Kanban вид</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--secondary)]" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
