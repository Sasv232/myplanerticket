"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Clock, FolderKanban, Zap, BarChart3,
  Settings, ArrowRight, TrendingUp, ListTodo,
} from "lucide-react";
import Link from "next/link";

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} style={{ height: 120, borderRadius: "var(--radius-lg)" }} />;
}

export function DashboardPageDesktop() {
  const { user } = useAuth();
  const router = useRouter();
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);

  useEffect(() => {
    setWidgetConfig(loadWidgetConfig());
    setLoaded(true);
    fetch("/api/tasks").then(r => r.json()).then(d => { if (Array.isArray(d)) setTasks(d); }).catch(() => {});
    fetch("/api/habits").then(r => r.json()).then(d => { if (Array.isArray(d)) setHabits(d); }).catch(() => {});
  }, []);

  const handleConfigChange = useCallback((newConfig: WidgetConfig[]) => {
    setWidgetConfig(newConfig);
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const dateStr = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  const todayTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === now.toDateString();
  });
  const activeTasks = tasks.filter((t: any) => t.status !== "done");
  const completedTasks = tasks.filter((t: any) => t.status === "done");
  const urgentTasks = tasks.filter((t: any) => t.priority === "urgent" && t.status !== "done");
  const doneHabits = habits.filter((h: any) => h.completedToday).length;
  const progressPct = tasks.length > 0 ? Math.round(completedTasks.length / tasks.length * 100) : 0;

  if (!loaded) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <div style={{ marginBottom: 48 }}><div className="skeleton" style={{ height: 48, width: 300, borderRadius: "var(--radius-sm)" }} /></div>
        <div className="dash-main">
          <SkeletonCard className="card-enter card-enter-1" />
          <SkeletonCard className="card-enter card-enter-2" />
          <SkeletonCard className="card-enter card-enter-3" />
          <SkeletonCard className="card-enter card-enter-4" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px 48px" }}>
      {/* Hero — full width */}
      <div className="card-enter card-enter-1" style={{ marginBottom: 48 }}>
        <div className="badge badge-primary" style={{ marginBottom: 12, width: "fit-content" }}>
          <Zap className="h-3 w-3" /> Планер
        </div>
        <h1 className="heading-hero">
          {greeting}, {user?.name?.split(" ")[0] || ""}
        </h1>
        <p className="text-body" style={{ marginTop: 8, maxWidth: 480 }}>
          {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}. Вот что у тебя на сегодня.
        </p>
      </div>

      {/* Asymmetric grid: 60% left, 40% right */}
      <div className="dash-main" style={{ marginBottom: 32 }}>
        {/* LEFT: Tasks on today (large card) */}
        <div className="card card-enter card-enter-2" style={{ padding: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <h2 className="heading-lg">Задачи на сегодня</h2>
                <p className="text-xs">{todayTasks.length} задач</p>
              </div>
            </div>
            <Link href="/tasks" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="task-item" onClick={() => router.push("/tasks")}>
                <div style={{
                  position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2,
                  background: task.priority === "urgent" ? "var(--error)" : task.priority === "high" ? "var(--orange)" : task.priority === "medium" ? "var(--primary)" : "var(--success)",
                }} />
                <div className="task-item-content">
                  <div className="task-item-title">{task.title}</div>
                  <div className="task-item-meta">
                    {task.dueDate && (
                      <span className="text-xs" style={{ color: new Date(task.dueDate) < now ? "var(--error)" : "var(--text-faint)" }}>
                        {new Date(task.dueDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <span className={`badge priority-${task.priority}`} style={{ height: 18, fontSize: 10, padding: "0 6px" }}>
                      {task.priority === "urgent" ? "Срочно" : task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {todayTasks.length === 0 && (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <div className="empty-state-icon" style={{ width: 48, height: 48 }}><CheckCircle className="h-6 w-6" /></div>
                <p className="empty-state-title" style={{ fontSize: 14 }}>Нет задач на сегодня</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Stats (tall card) */}
        <div className="card card-enter card-enter-3" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <h2 className="heading-lg" style={{ marginBottom: 20 }}>Статистика</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            <div className="stat-card" style={{ padding: 16 }}>
              <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}><Clock className="h-4 w-4" /></div>
              <div><div className="stat-value" style={{ fontSize: 22 }}>{activeTasks.length}</div><div className="stat-label">Активных</div></div>
            </div>
            <div className="stat-card" style={{ padding: 16 }}>
              <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}><CheckCircle className="h-4 w-4" /></div>
              <div><div className="stat-value" style={{ fontSize: 22 }}>{completedTasks.length}</div><div className="stat-label">Выполнено</div></div>
            </div>
            <div className="stat-card" style={{ padding: 16 }}>
              <div className="stat-icon" style={{ background: "var(--error-light)", color: "var(--error)" }}><TrendingUp className="h-4 w-4" /></div>
              <div><div className="stat-value" style={{ fontSize: 22 }}>{urgentTasks.length}</div><div className="stat-label">Срочных</div></div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span className="text-xs">Прогресс</span>
              <span className="text-xs tabular">{progressPct}%</span>
            </div>
            <div className="progress"><div className="progress-fill progress-fill-primary" style={{ width: `${progressPct}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Row 2: Habits + Timer + Projects */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Habits */}
        <div className="card card-enter card-enter-4" style={{ padding: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-md">Привычки</h2>
            <Link href="/habits" className="btn btn-ghost btn-sm"><ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="stat-value" style={{ fontSize: 28, color: "var(--primary)" }}>{doneHabits}/{habits.length}</div>
            <div className="stat-label">выполнено</div>
          </div>
          <div className="progress"><div className="progress-fill progress-fill-primary" style={{ width: `${habits.length > 0 ? (doneHabits / habits.length * 100) : 0}%` }} /></div>
        </div>

        {/* Pomodoro */}
        <Link href="/pomodoro" className="card card-interactive card-enter card-enter-5" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", gap: 12 }}>
          <div className="stat-icon" style={{
            background: "var(--gradient-primary)", color: "white", width: 52, height: 52, borderRadius: "var(--radius-md)",
          }}>
            <Zap className="h-5 w-5" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p className="heading-md">Таймер</p>
            <p className="text-muted" style={{ marginTop: 2 }}>Фокусировка</p>
          </div>
        </Link>

        {/* Projects */}
        <Link href="/projects" className="card card-interactive card-enter card-enter-6" style={{ padding: 20, textDecoration: "none" }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
            <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
              <FolderKanban className="h-4 w-4" />
            </div>
            <div>
              <h2 className="heading-md">Проекты</h2>
              <p className="text-muted">Команда</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="stat-card" style={{ padding: 12 }}>
              <div>
                <div className="stat-value tabular" style={{ fontSize: 18 }}>{tasks.filter((t: any) => t.projectId).length}</div>
                <div className="stat-label">В проектах</div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
              <div>
                <div className="stat-value tabular" style={{ fontSize: 18 }}>{tasks.filter((t: any) => !t.projectId).length}</div>
                <div className="stat-label">Личных</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Widget System — restored */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h2 className="heading-lg">Виджеты</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(true)}>
            <Settings className="h-3.5 w-3.5" /> Настроить
          </button>
        </div>
        {loaded && <WidgetRenderer config={widgetConfig} />}
      </div>

      <WidgetEditor open={editorOpen} onClose={() => setEditorOpen(false)} onChange={handleConfigChange} />
    </div>
  );
}
