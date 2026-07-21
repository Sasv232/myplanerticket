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
    <>
      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block">
        <Header title="Дашборд" description="Обзор ваших задач" />

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

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Cloud className="h-8 w-8 text-[var(--accent)]" />
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
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <DollarSign className="h-8 w-8 text-[var(--success)]" />
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
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Quote className="h-8 w-8 text-[var(--warning)]" />
              <div className="min-w-0">
                {quote ? (
                  <>
                    <p className="text-xs italic line-clamp-2">"{quote.text}"</p>
                    <p className="mt-1 text-[10px] text-[var(--secondary)]">— {quote.author}</p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--secondary)]">Загрузка...</p>
                )}
              </div>
            </CardContent>
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
                href="/pomodoro"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent)]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-medium">Таймер Pomodoro</p>
                    <p className="text-xs text-[var(--secondary)]">Фокусировка на задаче</p>
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
              <Link
                href="/calendar"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent)]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-medium">Календарь</p>
                    <p className="text-xs text-[var(--secondary)]">Задачи по датам</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--secondary)]" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== MOBILE ===== */}
      <div className="md:hidden space-y-5">
        <div className="mobile-page-header">
          <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-sm text-[var(--secondary)]">Обзор задач</p>
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <Card className="mobile-widget-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 shrink-0">
                  <Cloud className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div className="min-w-0">
                  {weather ? (
                    <>
                      <p className="text-lg font-bold">{weather.temp}</p>
                      <p className="text-xs text-[var(--secondary)] truncate">{weather.desc}</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10 shrink-0">
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

        {upcomingTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Ближайшие дедлайны</h2>
              <Link href="/tasks" className="text-xs text-[var(--accent)]">Все →</Link>
            </div>
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <Card key={task.id} className="mobile-task-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-[var(--secondary)]">
                          {new Date(task.dueDate!).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "warning" : "default"}>
                        {task.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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
    </>
  );
}
