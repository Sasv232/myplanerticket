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
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ListTodo className="h-4 w-4" /> К выполнению
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.todo}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> В работе
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Выполнено
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.done}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Срочных
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.urgent}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cloud className="h-5 w-5" /> Погода
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weather ? (
                  <>
                    <p className="text-2xl font-bold">{weather.temp}</p>
                    <p className="text-muted-foreground">{weather.desc}</p>
                    <p className="text-xs text-muted-foreground">
                      {weather.city}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Загрузка...</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Валюта
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currency ? (
                  <div className="space-y-1">
                    <p className="font-semibold">
                      USD {currency.usd.toFixed(1)} ₽
                    </p>
                    <p className="font-semibold">
                      EUR {currency.eur.toFixed(1)} ₽
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Загрузка...</p>
                )}
              </CardContent>
            </Card>
            {quote && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Quote className="h-5 w-5" /> Цитата дня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic">&ldquo;{quote.text}&rdquo;</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    — {quote.author}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {upcomingTasks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ближайшие дедлайны</CardTitle>
                <Link
                  href="/tasks"
                  className="text-sm text-primary hover:underline"
                >
                  Все задачи →
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
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
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Link href="/pomodoro">
              <Card className="group hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer h-full border border-border/50 hover:border-primary/30">
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    <Timer className="h-8 w-8 text-primary relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors duration-300">Pomodoro</p>
                    <p className="text-sm text-muted-foreground">Фокусировка</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/board">
              <Card className="group hover:scale-[1.03] hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 cursor-pointer h-full border border-border/50 hover:border-green-500/30">
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-green-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    <ListTodo className="h-8 w-8 text-green-500 relative z-10 group-hover:-rotate-6 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">Доска задач</p>
                    <p className="text-sm text-muted-foreground">Kanban вид</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/calendar">
              <Card className="group hover:scale-[1.03] hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer h-full border border-border/50 hover:border-orange-500/30">
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-orange-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                    <Clock className="h-8 w-8 text-orange-500 relative z-10 group-hover:rotate-[360deg] transition-transform duration-700" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Календарь</p>
                    <p className="text-sm text-muted-foreground">Задачи по датам</p>
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
