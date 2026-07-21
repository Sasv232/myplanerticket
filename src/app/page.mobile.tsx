"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
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
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useAuth } from "@/lib/auth-context";

interface Weather { temp: string; desc: string; city: string; }
interface Currency { usd: number; eur: number; }
interface QuoteData { text: string; author: string; }

export function DashboardPageMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const { user } = useAuth();
  const { setOpen } = useMobileSidebar();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.map((t: Task & { tags: string }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
      })));
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
    fetch("/api/widgets/weather").then((r) => r.json()).then((d) => { if (d.temp) setWeather(d); }).catch(() => {});
    fetch("/api/widgets/currency").then((r) => r.json()).then((d) => { if (d.usd) setCurrency(d); }).catch(() => {});
    fetch("/api/widgets/quote").then((r) => r.json()).then((d) => { if (d.text) setQuote(d); }).catch(() => {});
  }, [fetchTasks]);

  const stats = {
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
  };

  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const dateStr = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });

  return (
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold truncate">{greeting}, {user?.name?.split(" ")[0] || ""}!</p>
          <p className="text-[11px] text-[var(--secondary)] capitalize">{dateStr}</p>
        </div>
        <button onClick={() => setOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform shrink-0 ml-3">
          <span className="text-sm font-bold text-[var(--accent)]">{user?.name?.[0]?.toUpperCase() || "?"}</span>
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Stats — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Задачи", value: stats.todo, icon: <ListTodo className="h-4 w-4" />, color: "#2563eb" },
            { label: "В работе", value: stats.inProgress, icon: <Clock className="h-4 w-4" />, color: "#d97706" },
            { label: "Готово", value: stats.done, icon: <CheckCircle className="h-4 w-4" />, color: "#16a34a" },
            { label: "Срочно", value: stats.urgent, icon: <AlertTriangle className="h-4 w-4" />, color: "#dc2626" },
          ].map((s) => (
            <div key={s.label} className="mobile-stat-card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <span className="text-[11px] font-medium text-[var(--secondary)]">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions — 3 buttons */}
        <div>
          <p className="text-[13px] font-semibold mb-2.5 px-1">Быстрый доступ</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/pomodoro", icon: <Timer className="h-6 w-6" />, label: "Pomodoro", color: "#2563eb" },
              { href: "/board", icon: <ListTodo className="h-6 w-6" />, label: "Доска", color: "#16a34a" },
              { href: "/calendar", icon: <Clock className="h-6 w-6" />, label: "Календарь", color: "#d97706" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="mobile-quick-card p-4 flex flex-col items-center gap-2.5 text-center">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.color + "12" }}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                </div>
                <p className="text-[12px] font-semibold">{a.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Widgets — stacked */}
        {(weather || currency || quote) && (
          <div>
            <p className="text-[13px] font-semibold mb-2.5 px-1">Информация</p>
            <div className="space-y-2.5">
              {weather && (
                <div className="mobile-widget-card p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Cloud className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--secondary)]">Погода</p>
                    <p className="text-lg font-bold">{weather.temp}</p>
                    <p className="text-[11px] text-[var(--secondary)]">{weather.desc}, {weather.city}</p>
                  </div>
                </div>
              )}
              {currency && (
                <div className="mobile-widget-card p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--secondary)]">Валюта</p>
                    <div className="flex gap-4">
                      <span className="text-sm font-bold">USD {currency.usd.toFixed(1)} ₽</span>
                      <span className="text-sm font-bold">EUR {currency.eur.toFixed(1)} ₽</span>
                    </div>
                  </div>
                </div>
              )}
              {quote && (
                <div className="mobile-widget-card p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Quote className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--secondary)] mb-1">Цитата дня</p>
                    <p className="text-[13px] italic line-clamp-2">&ldquo;{quote.text}&rdquo;</p>
                    <p className="text-[10px] text-[var(--muted)] mt-1">— {quote.author}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className="text-[13px] font-semibold">Дедлайны</p>
              <Link href="/tasks" className="text-[11px] font-semibold text-[var(--accent)]">Все →</Link>
            </div>
            <div className="space-y-2">
              {upcoming.map((task) => (
                <div key={task.id} className="mobile-task-card p-3.5 flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{
                    backgroundColor: task.priority === "urgent" ? "#dc2626" : task.priority === "high" ? "#ea580c" : task.priority === "medium" ? "#2563eb" : "#16a34a"
                  }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate">{task.emoji && `${task.emoji} `}{task.title}</p>
                    <p className="text-[11px] text-[var(--secondary)]">
                      {new Date(task.dueDate!).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Badge variant={task.priority as "urgent" | "high" | "medium" | "low"} className="text-[9px] shrink-0">
                    {task.priority === "urgent" ? "Срочно" : task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
