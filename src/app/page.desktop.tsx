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

export function DashboardPageDesktop() {
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
            .then((d) => {
              if (d.temp) setWeather(d);
            })
            .catch(() => {});
        },
        () => {
          fetch("/api/widgets/weather")
            .then((r) => r.json())
            .then((d) => {
              if (d.temp) setWeather(d);
            })
            .catch(() => {});
        },
        { timeout: 5000 }
      );
    } else {
      fetch("/api/widgets/weather")
        .then((r) => r.json())
        .then((d) => {
          if (d.temp) setWeather(d);
        })
        .catch(() => {});
    }

    fetch("/api/widgets/currency")
      .then((r) => r.json())
      .then((d) => {
        if (d.usd) setCurrency(d);
      })
      .catch(() => {});

    fetch("/api/widgets/quote")
      .then((r) => r.json())
      .then((d) => {
        if (d.text) setQuote(d);
      })
      .catch(() => {});
  }, [fetchTasks]);

  const stats = {
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter(
      (t) => t.priority === "urgent" && t.status !== "done"
    ).length,
  };

  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5);

  return (
    <>
      <Header title="Дашборд" description="Обзор задач" />
      <main className="p-6">
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <Card elevated className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <ListTodo className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--secondary)]">К выполнению</p>
                    <p className="text-2xl font-bold">{stats.todo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card elevated className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--secondary)]">В работе</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card elevated className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--secondary)]">Выполнено</p>
                    <p className="text-2xl font-bold">{stats.done}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card elevated className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--secondary)]">Срочных</p>
                    <p className="text-2xl font-bold">{stats.urgent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widgets Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card elevated>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-500" /> Погода
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weather ? (
                  <div>
                    <p className="text-2xl font-bold">{weather.temp}</p>
                    <p className="text-sm text-[var(--secondary)]">{weather.desc}</p>
                    <p className="text-[11px] text-[var(--muted)] mt-1">{weather.city}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--secondary)]">Загрузка...</p>
                )}
              </CardContent>
            </Card>
            <Card elevated>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" /> Валюта
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currency ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">USD</span>
                      <span className="text-sm font-bold">{currency.usd.toFixed(1)} ₽</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">EUR</span>
                      <span className="text-sm font-bold">{currency.eur.toFixed(1)} ₽</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--secondary)]">Загрузка...</p>
                )}
              </CardContent>
            </Card>
            {quote && (
              <Card elevated>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Quote className="h-4 w-4 text-purple-500" /> Цитата дня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic text-[var(--foreground)]">&ldquo;{quote.text}&rdquo;</p>
                  <p className="mt-2 text-[11px] text-[var(--muted)]">— {quote.author}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming Deadlines */}
          {upcomingTasks.length > 0 && (
            <Card elevated>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Ближайшие дедлайны</CardTitle>
                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-[var(--accent)] hover:underline transition-colors"
                >
                  Все задачи →
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        {task.emoji && <span className="text-base">{task.emoji}</span>}
                        <div>
                          <p className="text-sm font-semibold">{task.title}</p>
                          <p className="text-[11px] text-[var(--secondary)]">
                            {new Date(task.dueDate!).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={task.priority as "urgent" | "high" | "medium" | "low"} className="text-[10px]">
                        {task.priority === "urgent" ? "Срочно" : task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Access */}
          <div className="grid grid-cols-3 gap-4">
            <Link href="/pomodoro">
              <Card hover className="group h-full">
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent)]/10 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    <Timer className="h-8 w-8 text-[var(--accent)] relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-[var(--accent)] transition-colors duration-150">Pomodoro</p>
                    <p className="text-xs text-[var(--secondary)]">Фокусировка</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/board">
              <Card hover className="group h-full">
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-green-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    <ListTodo className="h-8 w-8 text-green-500 relative z-10 group-hover:-rotate-6 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-150">Доска задач</p>
                    <p className="text-xs text-[var(--secondary)]">Kanban вид</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/calendar">
              <Card hover className="group h-full">
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-orange-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    <Clock className="h-8 w-8 text-orange-500 relative z-10 group-hover:rotate-[360deg] transition-transform duration-700" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-150">Календарь</p>
                    <p className="text-xs text-[var(--secondary)]">Задачи по датам</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
