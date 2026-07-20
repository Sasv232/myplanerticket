"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  ListTodo,
  AlertTriangle,
  ArrowRight,
  Cloud,
  DollarSign,
  Quote,
  Timer,
} from "lucide-react";

interface Weather {
  temp: string;
  desc: string;
  city: string;
}

interface Currency {
  usd: number;
  eur: number;
}

interface QuoteData {
  text: string;
  author: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(
        data.map((t: Task & { tags: string; repeat_rule: string | null }) => ({
          ...t,
          tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
          repeatRule: t.repeat_rule || t.repeatRule || null,
        }))
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`/api/widgets/weather?lat=${latitude}&lon=${longitude}`)
            .then((r) => r.json())
            .then((d) => { if (d.temp) setWeather(d); })
            .catch(() => {});
        },
        () => {
          fetch("/api/widgets/weather")
            .then((r) => r.json())
            .then((d) => { if (d.temp) setWeather(d); })
            .catch(() => {});
        },
        { timeout: 5000 }
      );
    } else {
      fetch("/api/widgets/weather")
        .then((r) => r.json())
        .then((d) => { if (d.temp) setWeather(d); })
        .catch(() => {});
    }

    fetch("/api/widgets/currency")
      .then((r) => r.json())
      .then((d) => { if (d.usd) setCurrency(d); })
      .catch(() => {});

    fetch("/api/widgets/quote")
      .then((r) => r.json())
      .then((d) => { if (d.text) setQuote(d); })
      .catch(() => {});
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
    <div className="space-y-5">
      <div className="mobile-page-header">
        <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
        <p className="text-sm text-[var(--secondary)]">Обзор задач</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/tasks">
          <Card className="mobile-stat-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <ListTodo className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todo}</p>
                  <p className="text-xs text-[var(--secondary)]">К выполнению</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="mobile-stat-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10">
                  <Clock className="h-5 w-5 text-[var(--warning)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-[var(--secondary)]">В работе</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="mobile-stat-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10">
                  <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.done}</p>
                  <p className="text-xs text-[var(--secondary)]">Выполнено</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="mobile-stat-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--error)]/10">
                  <AlertTriangle className="h-5 w-5 text-[var(--error)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.urgent}</p>
                  <p className="text-xs text-[var(--secondary)]">Срочных</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="mobile-widget-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Cloud className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                {weather ? (
                  <>
                    <p className="text-lg font-bold">{weather.temp}</p>
                    <p className="text-xs text-[var(--secondary)]">{weather.desc}</p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--secondary)]">Загрузка...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mobile-widget-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10">
                <DollarSign className="h-5 w-5 text-[var(--success)]" />
              </div>
              <div>
                {currency ? (
                  <>
                    <p className="text-sm font-bold">USD {currency.usd.toFixed(1)} ₽</p>
                    <p className="text-sm font-bold">EUR {currency.eur.toFixed(1)} ₽</p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--secondary)]">Загрузка...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote */}
      {quote && (
        <Card className="mobile-widget-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10 shrink-0">
                <Quote className="h-5 w-5 text-[var(--warning)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm italic line-clamp-2">"{quote.text}"</p>
                <p className="mt-1 text-xs text-[var(--secondary)]">— {quote.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Ближайшие дедлайны</h2>
            <Link href="/tasks" className="text-xs text-[var(--accent)]">
              Все →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <Card key={task.id} className="mobile-task-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div>
        <h2 className="text-base font-semibold mb-3">Быстрый доступ</h2>
        <div className="space-y-2">
          <Link href="/pomodoro">
            <Card className="mobile-quick-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                      <Timer className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Таймер Pomodoro</p>
                      <p className="text-xs text-[var(--secondary)]">Фокусировка</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--secondary)]" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/board">
            <Card className="mobile-quick-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10">
                      <ListTodo className="h-5 w-5 text-[var(--success)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Доска задач</p>
                      <p className="text-xs text-[var(--secondary)]">Kanban вид</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--secondary)]" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/calendar">
            <Card className="mobile-quick-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10">
                      <Clock className="h-5 w-5 text-[var(--warning)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Календарь</p>
                      <p className="text-xs text-[var(--secondary)]">Задачи по датам</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--secondary)]" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
