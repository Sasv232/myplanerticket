"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Cloud, DollarSign, Quote, CheckCircle, Clock, ListTodo,
  AlertTriangle, Timer, Flame, TrendingUp, Edit3, Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ====== Task Stats ======
export function TaskStatsWidget() {
  const [data, setData] = useState<{ todo: number; inProgress: number; done: number; urgent: number } | null>(null);
  useEffect(() => {
    fetch("/api/tasks").then((r) => r.json()).then((tasks) => {
      if (!Array.isArray(tasks)) return;
      setData({
        todo: tasks.filter((t: { status: string }) => t.status === "todo").length,
        inProgress: tasks.filter((t: { status: string }) => t.status === "in_progress").length,
        done: tasks.filter((t: { status: string }) => t.status === "done").length,
        urgent: tasks.filter((t: { status: string; priority: string }) => t.priority === "urgent" && t.status !== "done").length,
      });
    }).catch(() => {});
  }, []);
  if (!data) return <WidgetSkeleton />;

  const total = data.todo + data.inProgress + data.done;
  const rate = total > 0 ? Math.round((data.done / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--secondary)]">Выполнение</span>
        <span className="text-[11px] font-bold">{rate}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--success)] transition-all duration-700" style={{ width: `${rate}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Задачи", value: data.todo, color: "#2563eb" },
          { label: "В работе", value: data.inProgress, color: "#d97706" },
          { label: "Готово", value: data.done, color: "#16a34a" },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 rounded-xl bg-[var(--surface)]">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-[var(--secondary)]">{s.label}</p>
          </div>
        ))}
      </div>
      {data.urgent > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
          <AlertTriangle className="h-3 w-3" /> {data.urgent} срочных задач
        </div>
      )}
      <Link href="/tasks" className="block text-center text-[11px] font-semibold text-[var(--accent)] hover:underline">Все задачи →</Link>
    </div>
  );
}

// ====== Weather ======
export function WeatherWidget() {
  const [data, setData] = useState<{ temp: string; desc: string; city: string } | null>(null);
  useEffect(() => {
    fetch("/api/widgets/weather").then((r) => r.json()).then((d) => { if (d.temp) setData(d); }).catch(() => {});
  }, []);
  if (!data) return <WidgetSkeleton />;
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
        <Cloud className="h-6 w-6 text-blue-500" />
      </div>
      <div>
        <p className="text-2xl font-bold">{data.temp}</p>
        <p className="text-[11px] text-[var(--secondary)]">{data.desc}</p>
        <p className="text-[10px] text-[var(--muted)]">{data.city}</p>
      </div>
    </div>
  );
}

// ====== Currency ======
export function CurrencyWidget() {
  const [data, setData] = useState<{ usd: number; eur: number } | null>(null);
  useEffect(() => {
    fetch("/api/widgets/currency").then((r) => r.json()).then((d) => { if (d.usd) setData(d); }).catch(() => {});
  }, []);
  if (!data) return <WidgetSkeleton />;
  return (
    <div className="space-y-2">
      {[
        { label: "USD", value: data.usd, flag: "🇺🇸" },
        { label: "EUR", value: data.eur, flag: "🇪🇺" },
      ].map((c) => (
        <div key={c.label} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <span className="text-base">{c.flag}</span>
            <span className="text-[13px] font-semibold">{c.label}</span>
          </div>
          <span className="text-[14px] font-bold">{c.value.toFixed(2)} ₽</span>
        </div>
      ))}
    </div>
  );
}

// ====== Quote ======
export function QuoteWidget() {
  const [data, setData] = useState<{ text: string; author: string } | null>(null);
  useEffect(() => {
    fetch("/api/widgets/quote").then((r) => r.json()).then((d) => { if (d.text) setData(d); }).catch(() => {});
  }, []);
  if (!data) return <WidgetSkeleton />;
  return (
    <div className="text-center py-2">
      <p className="text-[14px] italic leading-relaxed">&ldquo;{data.text}&rdquo;</p>
      <p className="mt-2 text-[11px] text-[var(--muted)]">— {data.author}</p>
    </div>
  );
}

// ====== Habits Today ======
export function HabitsTodayWidget() {
  const [habits, setHabits] = useState<{ id: string; name: string; emoji: string; color: string; logs: { date: string }[] }[]>([]);
  useEffect(() => {
    fetch("/api/habits").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setHabits(d); }).catch(() => {});
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const done = habits.filter((h) => h.logs?.some((l) => l.date === today)).length;
  const total = habits.length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  if (total === 0) return (
    <div className="text-center py-3">
      <p className="text-[13px] text-[var(--secondary)]">Нет привычек</p>
      <Link href="/habits" className="text-[11px] text-[var(--accent)] font-semibold hover:underline">Создать →</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--secondary)]">{done}/{total} выполнено</span>
        <span className="text-[11px] font-bold">{rate}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
        <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${rate}%` }} />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {habits.map((h) => {
          const doneToday = h.logs?.some((l) => l.date === today);
          return (
            <div key={h.id} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${doneToday ? "text-white" : "bg-[var(--surface)]"}`}
              style={doneToday ? { backgroundColor: h.color } : undefined}>
              <span>{h.emoji}</span>
              <span className="truncate max-w-[60px]">{h.name}</span>
            </div>
          );
        })}
      </div>
      <Link href="/habits" className="block text-center text-[11px] font-semibold text-[var(--accent)] hover:underline">Все привычки →</Link>
    </div>
  );
}

// ====== Upcoming Deadlines ======
export function UpcomingWidget() {
  const [tasks, setTasks] = useState<{ id: string; title: string; emoji: string | null; dueDate: string; priority: string }[]>([]);
  useEffect(() => {
    fetch("/api/tasks").then((r) => r.json()).then((d) => {
      if (!Array.isArray(d)) return;
      const upcoming = d
        .filter((t: { dueDate: string | null; status: string }) => t.dueDate && t.status !== "done")
        .sort((a: { dueDate: string }, b: { dueDate: string }) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4);
      setTasks(upcoming);
    }).catch(() => {});
  }, []);

  if (tasks.length === 0) return (
    <p className="text-center text-[13px] text-[var(--secondary)] py-2">Нет задач с дедлайнами</p>
  );

  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--surface)]">
          <div className="w-1 h-8 rounded-full shrink-0" style={{
            backgroundColor: t.priority === "urgent" ? "#dc2626" : t.priority === "high" ? "#ea580c" : t.priority === "medium" ? "#2563eb" : "#16a34a"
          }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate">{t.emoji && `${t.emoji} `}{t.title}</p>
            <p className="text-[10px] text-[var(--secondary)]">{new Date(t.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</p>
          </div>
        </div>
      ))}
      <Link href="/tasks" className="block text-center text-[11px] font-semibold text-[var(--accent)] hover:underline">Все задачи →</Link>
    </div>
  );
}

// ====== Pomodoro Quick Start ======
export function PomodoroWidget() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <Timer className="h-8 w-8 text-red-500" />
      </div>
      <Link href="/pomodoro" className="px-4 py-2 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors">
        Начать Pomodoro
      </Link>
    </div>
  );
}

// ====== Karma ======
export function KarmaWidget() {
  const [karma, setKarma] = useState<{ points: number; level: number; streak: number } | null>(null);
  useEffect(() => {
    fetch("/api/karma").then((r) => r.json()).then((d) => { if (d && d.points !== undefined) setKarma(d); }).catch(() => {});
  }, []);
  if (!karma) return <WidgetSkeleton />;

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Очки", value: karma.points, color: "#f97316", icon: <TrendingUp className="h-4 w-4" /> },
        { label: "Уровень", value: karma.level, color: "#3b82f6", icon: <Flame className="h-4 w-4" /> },
        { label: "Серия", value: karma.streak, color: "#ef4444", icon: <Flame className="h-4 w-4" /> },
      ].map((s) => (
        <div key={s.label} className="text-center p-2.5 rounded-xl bg-[var(--surface)]">
          <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
          <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[9px] text-[var(--secondary)]">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ====== Quick Note ======
export function QuickNoteWidget() {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedNote = localStorage.getItem("quick-note") || "";
    setNote(savedNote);
  }, []);

  const save = () => {
    localStorage.setItem("quick-note", note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Напишите заметку..."
        className="w-full h-24 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--muted)]">{note.length} символов</span>
        <button onClick={save} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-semibold hover:bg-[var(--accent-hover)] transition-colors">
          {saved ? "✓ Сохранено" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

// ====== Weekly Chart ======
export function WeeklyChartWidget() {
  const [data, setData] = useState<{ label: string; count: number }[]>([]);
  useEffect(() => {
    fetch("/api/tasks").then((r) => r.json()).then((tasks) => {
      if (!Array.isArray(tasks)) return;
      const done = tasks.filter((t: { status: string }) => t.status === "done");
      const now = new Date();
      const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      const chart = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        chart.push({
          label: days[d.getDay()],
          count: done.filter((t: { completedAt: string | null }) => t.completedAt?.startsWith(key)).length,
        });
      }
      setData(chart);
    }).catch(() => {});
  }, []);

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex gap-1.5 items-end h-24">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full flex items-end justify-center h-16">
            <div className="w-full max-w-[28px] rounded-t-lg transition-all duration-500"
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? "6px" : "0",
                backgroundColor: d.count > 0 ? "var(--accent)" : "var(--surface)",
              }} />
          </div>
          <span className="text-[9px] font-medium text-[var(--secondary)]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ====== Skeleton ======
function WidgetSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-[var(--surface)] rounded w-1/3" />
      <div className="h-8 bg-[var(--surface)] rounded w-2/3" />
      <div className="h-3 bg-[var(--surface)] rounded w-1/2" />
    </div>
  );
}
