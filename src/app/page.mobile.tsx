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
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
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
  const { theme, toggle } = useTheme();
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
        <div>
          <p className="text-lg font-bold">{greeting}, {user?.name?.split(" ")[0] || ""}!</p>
          <p className="text-[11px] text-[var(--secondary)] capitalize">{dateStr}</p>
        </div>
        <button onClick={() => setOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform">
          <span className="text-sm font-bold text-[var(--accent)]">{user?.name?.[0]?.toUpperCase() || "?"}</span>
        </button>
      </div>

      <div className="mobile-content space-y-4">
        {/* Stats row */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
          {[
            { label: "Задачи", value: stats.todo, icon: <ListTodo className="h-4 w-4" />, color: "#2563eb", bg: "#2563eb15" },
            { label: "В работе", value: stats.inProgress, icon: <Clock className="h-4 w-4" />, color: "#d97706", bg: "#d9770615" },
            { label: "Готово", value: stats.done, icon: <CheckCircle className="h-4 w-4" />, color: "#16a34a", bg: "#16a34a15" },
            { label: "Срочно", value: stats.urgent, icon: <AlertTriangle className="h-4 w-4" />, color: "#dc2626", bg: "#dc262615" },
          ].map((s) => (
            <div key={s.label} className="mobile-stat-card p-3 min-w-[100px] snap-start flex-shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--secondary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { href: "/pomodoro", icon: <Timer className="h-6 w-6" />, label: "Pomodoro", sub: "Фокус", color: "#2563eb" },
            { href: "/board", icon: <ListTodo className="h-6 w-6" />, label: "Доска", sub: "Kanban", color: "#16a34a" },
            { href: "/calendar", icon: <Clock className="h-6 w-6" />, label: "Календарь", sub: "Даты", color: "#d97706" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="mobile-quick-card p-4 flex flex-col items-center gap-2 text-center">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.color + "12" }}>
                <span style={{ color: a.color }}>{a.icon}</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold">{a.label}</p>
                <p className="text-[10px] text-[var(--secondary)]">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Widgets */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
          {weather && (
            <div className="mobile-widget-card p-3.5 min-w-[130px] snap-start flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Cloud className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] text-[var(--secondary)]">Погода</span>
              </div>
              <p className="text-lg font-bold">{weather.temp}</p>
              <p className="text-[10px] text-[var(--secondary)]">{weather.desc}</p>
            </div>
          )}
          {currency && (
            <div className="mobile-widget-card p-3.5 min-w-[130px] snap-start flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-green-400" />
                <span className="text-[10px] text-[var(--secondary)]">Валюта</span>
              </div>
              <p className="text-sm font-bold">USD {currency.usd.toFixed(1)} ₽</p>
              <p className="text-sm font-bold">EUR {currency.eur.toFixed(1)} ₽</p>
            </div>
          )}
          {quote && (
            <div className="mobile-widget-card p-3.5 min-w-[160px] max-w-[200px] snap-start flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Quote className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-[var(--secondary)]">Цитата</span>
              </div>
              <p className="text-[11px] italic line-clamp-3">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-[9px] text-[var(--muted)] mt-1">— {quote.author}</p>
            </div>
          )}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Дедлайны</p>
              <Link href="/tasks" className="text-[11px] font-semibold text-[var(--accent)]">Все →</Link>
            </div>
            <div className="space-y-2">
              {upcoming.map((task) => (
                <div key={task.id} className="mobile-task-card p-3 flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{
                    backgroundColor: task.priority === "urgent" ? "#dc2626" : task.priority === "high" ? "#ea580c" : task.priority === "medium" ? "#2563eb" : "#16a34a"
                  }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{task.emoji && `${task.emoji} `}{task.title}</p>
                    <p className="text-[10px] text-[var(--secondary)]">
                      {new Date(task.dueDate!).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Badge variant={task.priority as "urgent" | "high" | "medium" | "low"} className="text-[9px] flex-shrink-0">
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
