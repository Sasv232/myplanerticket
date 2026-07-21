"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, CheckCircle, Clock, Flame } from "lucide-react";

interface Karma {
  points: number;
  level: number;
  streak: number;
}

interface Task {
  id: string;
  status: string;
  priority: string;
  createdAt: string;
  completedAt: string | null;
}

function getWeekLabel(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function StatsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [karma, setKarma] = useState<Karma | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month">("week");
  const { setOpen } = useMobileSidebar();

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/karma").then((r) => r.json()).catch(() => null),
    ])
      .then(([t, k]) => {
        if (Array.isArray(t)) setTasks(t);
        if (k && k.points !== undefined) setKarma(k);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done = tasks.filter((t) => t.status === "done");
  const total = tasks.length;
  const rate = total > 0 ? Math.round((done.length / total) * 100) : 0;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 29);

  const weeklyData: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    weeklyData.push({
      label: dayNames[d.getDay()],
      count: done.filter((t) => t.completedAt && t.completedAt.startsWith(key)).length,
    });
  }

  const monthlyData: { label: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    monthlyData.push({
      label: `${getWeekLabel(start)}`,
      count: done.filter((t) => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= start && d <= end;
      }).length,
    });
  }

  const chartData = view === "week" ? weeklyData : monthlyData;
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  const avgPerDay = total > 0 ? (done.length / Math.max(1, Math.ceil((now.getTime() - new Date(tasks[0]?.createdAt || now).getTime()) / 86400000))).toFixed(1) : "0";

  const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--secondary)]">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );

  const ChartBar = ({ label, count, max }: { label: string; count: number; max: number }) => (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="w-full h-28 flex items-end justify-center">
        <div
          className="w-full max-w-[36px] rounded-t-lg transition-all duration-500"
          style={{
            height: `${max > 0 ? (count / max) * 100 : 0}%`,
            minHeight: count > 0 ? "8px" : "0px",
            backgroundColor: count > 0 ? "var(--accent)" : "var(--surface)",
          }}
        />
      </div>
      <span className="text-[10px] font-medium text-[var(--secondary)]">{label}</span>
      <span className="text-[11px] font-bold">{count}</span>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<CheckCircle className="h-5 w-5" style={{ color: "#16a34a" }} />} label="Всего" value={total} color="#16a34a" />
        <StatCard icon={<TrendingUp className="h-5 w-5" style={{ color: "#2563eb" }} />} label="Выполнено" value={done.length} color="#2563eb" />
        <StatCard icon={<BarChart3 className="h-5 w-5" style={{ color: "#d97706" }} />} label="Процент" value={`${rate}%`} color="#d97706" />
        <StatCard icon={<Clock className="h-5 w-5" style={{ color: "#7c3aed" }} />} label="В день" value={avgPerDay} color="#7c3aed" />
      </div>

      {/* Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Продуктивность</p>
          <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-0.5">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === "week" ? "bg-[var(--card)] shadow-sm" : "text-[var(--secondary)]"}`}
            >Неделя</button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === "month" ? "bg-[var(--card)] shadow-sm" : "text-[var(--secondary)]"}`}
            >Месяц</button>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          {chartData.map((d, i) => (
            <ChartBar key={i} label={d.label} count={d.count} max={maxCount} />
          ))}
        </div>
      </Card>

      {/* Karma */}
      {karma && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold">Карма</p>
              <p className="text-[11px] text-[var(--secondary)]">Уровень {karma.level}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-[var(--surface)]">
              <p className="text-xl font-bold text-orange-500">{karma.points}</p>
              <p className="text-[10px] text-[var(--secondary)]">Очки</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--surface)]">
              <p className="text-xl font-bold text-blue-500">{karma.level}</p>
              <p className="text-[10px] text-[var(--secondary)]">Уровень</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--surface)]">
              <p className="text-xl font-bold text-red-500">{karma.streak}</p>
              <p className="text-[10px] text-[var(--secondary)]">Серия</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Header title="Статистика" description="Ваша продуктивность" />
        <main className="p-6">{loading ? <div className="py-20 text-center text-[var(--secondary)]">Загрузка...</div> : content}</main>
      </div>

      {/* Mobile */}
      <div className="md:hidden mobile-main">
        <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform">
              <span className="text-sm font-bold text-[var(--accent)]">M</span>
            </button>
            <p className="text-lg font-bold">Статистика</p>
          </div>
        </div>
        <div className="mobile-content">
          {loading ? (
            <div className="py-20 text-center text-[var(--secondary)] text-sm">Загрузка...</div>
          ) : (
            <div className="space-y-4">
              {/* Mobile stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="mobile-stat-card p-3 text-center">
                  <p className="text-xl font-bold">{total}</p>
                  <p className="text-[10px] text-[var(--secondary)]">Всего</p>
                </div>
                <div className="mobile-stat-card p-3 text-center">
                  <p className="text-xl font-bold text-green-500">{done.length}</p>
                  <p className="text-[10px] text-[var(--secondary)]">Выполнено</p>
                </div>
                <div className="mobile-stat-card p-3 text-center">
                  <p className="text-xl font-bold text-amber-500">{rate}%</p>
                  <p className="text-[10px] text-[var(--secondary)]">Процент</p>
                </div>
                <div className="mobile-stat-card p-3 text-center">
                  <p className="text-xl font-bold text-purple-500">{avgPerDay}</p>
                  <p className="text-[10px] text-[var(--secondary)]">В день</p>
                </div>
              </div>

              {/* Mobile chart */}
              <div className="mobile-widget-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Продуктивность</p>
                  <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-0.5">
                    <button onClick={() => setView("week")} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${view === "week" ? "bg-[var(--card)] shadow-sm" : "text-[var(--secondary)]"}`}>Неделя</button>
                    <button onClick={() => setView("month")} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${view === "month" ? "bg-[var(--card)] shadow-sm" : "text-[var(--secondary)]"}`}>Месяц</button>
                  </div>
                </div>
                <div className="flex gap-1.5 items-end h-24">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full flex items-end justify-center h-16">
                        <div className="w-full max-w-[24px] rounded-t" style={{ height: `${maxCount > 0 ? (d.count / maxCount) * 100 : 0}%`, minHeight: d.count > 0 ? "4px" : "0", backgroundColor: d.count > 0 ? "var(--accent)" : "var(--surface)" }} />
                      </div>
                      <span className="text-[8px] text-[var(--secondary)]">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile karma */}
              {karma && (
                <div className="mobile-widget-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-semibold">Карма</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-xl bg-[var(--surface)]">
                      <p className="text-lg font-bold text-orange-500">{karma.points}</p>
                      <p className="text-[9px] text-[var(--secondary)]">Очки</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[var(--surface)]">
                      <p className="text-lg font-bold text-blue-500">{karma.level}</p>
                      <p className="text-[9px] text-[var(--secondary)]">Уровень</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[var(--surface)]">
                      <p className="text-lg font-bold text-red-500">{karma.streak}</p>
                      <p className="text-[9px] text-[var(--secondary)]">Серия</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
