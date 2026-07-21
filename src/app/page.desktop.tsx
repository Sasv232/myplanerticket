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

  const totalTimeTracked = tasks.reduce((acc, t) => {
    const match = (t.description || "").match(/(\d+)h\s*(\d+)m/);
    if (match) return acc + parseInt(match[1]) * 60 + parseInt(match[2]);
    return acc;
  }, 0);

  return (
    <div>
      <Header title="╨Ф╨░╤И╨▒╨╛╤А╨┤" description="╨Ю╨▒╨╖╨╛╤А ╨▓╨░╤И╨╕╤Е ╨╖╨░╨┤╨░╤З" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="hover:border-[var(--accent)]/30 transition-colors">
          <Link href="/tasks">
            <CardContent className="flex items-center gap-3 p-4">
              <ListTodo className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-2xl font-bold">{stats.todo}</p>
                <p className="text-xs text-[var(--secondary)]">╨Ъ ╨▓╤Л╨┐╨╛╨╗╨╜╨╡╨╜╨╕╤О</p>
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
                <p className="text-xs text-[var(--secondary)]">╨Т ╤А╨░╨▒╨╛╤В╨╡</p>
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
                <p className="text-xs text-[var(--secondary)]">╨Т╤Л╨┐╨╛╨╗╨╜╨╡╨╜╨╛</p>
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
                <p className="text-xs text-[var(--secondary)]">╨б╤А╨╛╤З╨╜╤Л╤Е</p>
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
                <p className="text-sm text-[var(--secondary)]">╨Ч╨░╨│╤А╤Г╨╖╨║╨░...</p>
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
                  <p className="text-sm font-bold">USD {currency.usd.toFixed(1)} тВ╜</p>
                  <p className="text-sm font-bold">EUR {currency.eur.toFixed(1)} тВ╜</p>
                </>
              ) : (
                <p className="text-sm text-[var(--secondary)]">╨Ч╨░╨│╤А╤Г╨╖╨║╨░...</p>
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
                  <p className="mt-1 text-[10px] text-[var(--secondary)]">тАФ {quote.author}</p>
                </>
              ) : (
                <p className="text-sm text-[var(--secondary)]">╨Ч╨░╨│╤А╤Г╨╖╨║╨░...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              ╨С╨╗╨╕╨╢╨░╨╣╤И╨╕╨╡ ╨┤╨╡╨┤╨╗╨░╨╣╨╜╤Л
              <Link href="/tasks" className="text-xs text-[var(--accent)] hover:underline">
                ╨Т╤Б╨╡ ╨╖╨░╨┤╨░╤З╨╕ тЖТ
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-[var(--secondary)]">╨Э╨╡╤В ╨╖╨░╨┤╨░╤З ╤Б ╨┤╨╡╨┤╨╗╨░╨╣╨╜╨░╨╝╨╕</p>
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
            <CardTitle className="text-base">╨С╤Л╤Б╤В╤А╤Л╨╣ ╨┤╨╛╤Б╤В╤Г╨┐</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/pomodoro"
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent)]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium">╨в╨░╨╣╨╝╨╡╤А Pomodoro</p>
                  <p className="text-xs text-[var(--secondary)]">╨д╨╛╨║╤Г╤Б╨╕╤А╨╛╨▓╨║╨░ ╨╜╨░ ╨╖╨░╨┤╨░╤З╨╡</p>
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
                  <p className="text-sm font-medium">╨Ф╨╛╤Б╨║╨░ ╨╖╨░╨┤╨░╤З</p>
                  <p className="text-xs text-[var(--secondary)]">Kanban ╨▓╨╕╨┤</p>
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
                  <p className="text-sm font-medium">╨Ъ╨░╨╗╨╡╨╜╨┤╨░╤А╤М</p>
                  <p className="text-xs text-[var(--secondary)]">╨Ч╨░╨┤╨░╤З╨╕ ╨┐╨╛ ╨┤╨░╤В╨░╨╝</p>
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
