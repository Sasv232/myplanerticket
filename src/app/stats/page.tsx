"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { BarChart3, CheckCircle, Flame, Target, TrendingUp } from "lucide-react";

interface KarmaData {
  id: string;
  points: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
}

interface TaskData {
  id: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
}

function StatsContent() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [karma, setKarma] = useState<KarmaData | null>(null);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => {});
    fetch("/api/karma")
      .then((r) => r.json())
      .then(setKarma)
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const doneTasks = tasks.filter((t) => t.status === "done");
    const todayStr = now.toISOString().split("T")[0];
    const completedToday = doneTasks.filter((t) => {
      const d = t.completedAt || t.createdAt;
      return d && d.startsWith(todayStr);
    }).length;

    const totalDays = Math.max(
      1,
      Math.ceil(
        (now.getTime() - new Date(tasks[0]?.createdAt || now).getTime()) /
          86400000
      )
    );

    return {
      total: tasks.length,
      completed: doneTasks.length,
      completionRate:
        tasks.length > 0
          ? Math.round((doneTasks.length / tasks.length) * 100)
          : 0,
      averagePerDay: (doneTasks.length / totalDays).toFixed(1),
      completedToday,
    };
  }, [tasks]);

  const weeklyData = useMemo(() => {
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, i) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayStr = dayDate.toISOString().split("T")[0];
      const count = tasks.filter((t) => {
        if (t.status !== "done") return false;
        const d = t.completedAt || t.createdAt;
        return d && d.startsWith(dayStr);
      }).length;
      return { label: day, count };
    });
  }, [tasks]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];
      const count = tasks.filter((t) => {
        if (t.status !== "done") return false;
        const d = t.completedAt || t.createdAt;
        return d && d >= startStr && d <= endStr;
      }).length;
      return {
        label: `${weekStart.getDate()}-${weekEnd.getDate()}`,
        count,
      };
    }).reverse();
  }, [tasks]);

  const chartData = view === "weekly" ? weeklyData : monthlyData;
  const maxCount = Math.max(1, ...chartData.map((d) => d.count));

  return (
    <>
      <Header
        title="Статистика"
        description="Ваша продуктивность и прогресс"
      />

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Target className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-[var(--secondary)]">Всего задач</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-[var(--success)]" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-[var(--secondary)]">Выполнено</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <TrendingUp className="h-5 w-5 text-[var(--warning)]" />
              <div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-[var(--secondary)]">Процент</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-2xl font-bold">{stats.averagePerDay}</p>
                <p className="text-xs text-[var(--secondary)]">В день</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {karma && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-[var(--warning)]" />
                <h3 className="font-semibold text-sm">Карма и стрики</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--accent)]">
                    {karma.points}
                  </p>
                  <p className="text-xs text-[var(--secondary)] mt-1">
                    Очков
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--success)]">
                    {karma.level}
                  </p>
                  <p className="text-xs text-[var(--secondary)] mt-1">
                    Уровень
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--warning)]">
                    {karma.streak}
                  </p>
                  <p className="text-xs text-[var(--secondary)] mt-1">
                    Серия дней
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Активность</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setView("weekly")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    view === "weekly"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Неделя
                </button>
                <button
                  onClick={() => setView("monthly")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    view === "monthly"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Месяц
                </button>
              </div>
            </div>

            <div className="flex items-end gap-2 h-40">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[10px] text-[var(--secondary)]">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[var(--accent)]/70 transition-all duration-500"
                    style={{
                      height: `${(d.count / maxCount) * 100}%`,
                      minHeight: d.count > 0 ? "4px" : "0px",
                    }}
                  />
                  <span className="text-[10px] text-[var(--secondary)]">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">Сегодня</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--success)] transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (stats.completedToday / Math.max(1, stats.total)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium">{stats.completedToday}</span>
            </div>
            <p className="text-xs text-[var(--secondary)]">
              задач выполнено сегодня
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function StatsPage() {
  return (
    <>
      <div className="hidden md:block">
        <StatsContent />
      </div>
      <div className="md:hidden">
        <div className="mobile-page-header">
          <h1 className="text-2xl font-bold tracking-tight">Статистика</h1>
          <p className="text-sm text-[var(--secondary)]">Продуктивность</p>
        </div>
        <StatsContent />
      </div>
    </>
  );
}
