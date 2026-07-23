"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Clock, FolderKanban, Zap, TrendingUp, ListTodo,
  AlertTriangle, ArrowRight,
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
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    setWidgetConfig(loadWidgetConfig());
    setLoaded(true);
    fetch("/api/tasks").then(r => r.json()).then(d => { if (Array.isArray(d)) setTasks(d); }).catch(() => {});
    fetch("/api/habits").then(r => r.json()).then(d => { if (Array.isArray(d)) setHabits(d); }).catch(() => {});
    fetch("/api/projects").then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d); }).catch(() => {});
  }, []);

  const handleConfigChange = useCallback((newConfig: WidgetConfig[]) => {
    setWidgetConfig(newConfig);
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const dateStr = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  const projectMap = Object.fromEntries(projects.map((p: any) => [p.id, p.name]));

  const todayTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === now.toDateString();
  });
  const activeTasks = tasks.filter((t: any) => t.status !== "done");
  const completedTasks = tasks.filter((t: any) => t.status === "done");
  const urgentTasks = tasks.filter((t: any) => t.priority === "urgent" && t.status !== "done");
  const doneHabits = habits.filter((h: any) => h.completedToday).length;

  const nextDeadline = tasks
    .filter((t: any) => t.dueDate && t.status !== "done" && new Date(t.dueDate) >= now)
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const getDeadlineColor = (date: string) => {
    const d = new Date(date);
    const diff = d.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return "var(--error)";
    if (days < 1) return "var(--orange)";
    if (days < 3) return "var(--warning)";
    return "var(--text-muted)";
  };

  if (!loaded) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <div style={{ marginBottom: 48 }}><div className="skeleton" style={{ height: 48, width: 300, borderRadius: "var(--radius-sm)" }} /></div>
        <div className="dash-main">
          <SkeletonCard className="card-enter card-enter-1" />
          <SkeletonCard className="card-enter card-enter-2" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px 48px" }}>
      <div className="card-enter card-enter-1" style={{ marginBottom: 48 }}>
        <h1 className="heading-hero">
          {greeting}, {user?.name?.split(" ")[0] || ""}
        </h1>
        <p className="text-body" style={{ marginTop: 6 }}>
          {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
        </p>
      </div>

      <div className="dash-main" style={{ marginBottom: 24 }}>
        <div className="card card-enter card-enter-2" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todayTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="task-item" onClick={() => router.push("/tasks")}>
                <div className={`priority-dot priority-dot-${task.priority}`} style={{ marginTop: 6 }} />
                <div className="task-item-content">
                  <div className="task-item-title">{task.title}</div>
                  <div className="task-item-meta">
                    {task.projectId && (
                      <span className="badge badge-outline" style={{ height: 16, fontSize: 10, padding: "0 5px" }}>
                        {projectMap[task.projectId] || "Проект"}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs" style={{ color: getDeadlineColor(task.dueDate) }}>
                        {new Date(task.dueDate).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-enter card-enter-3" style={{ padding: 20 }}>
            <h2 className="heading-md" style={{ marginBottom: 16 }}>Статистика</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div className="stat-value tabular" style={{ fontSize: 20, color: "var(--primary)" }}>{activeTasks.length}</div>
                <div className="stat-label">Активных</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="stat-value tabular" style={{ fontSize: 20, color: "var(--success)" }}>{completedTasks.length}</div>
                <div className="stat-label">Готово</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="stat-value tabular" style={{ fontSize: 20, color: "var(--error)" }}>{urgentTasks.length}</div>
                <div className="stat-label">Срочных</div>
              </div>
            </div>
          </div>

          {nextDeadline && (
            <div className="card card-enter card-enter-4" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle className="h-4 w-4" style={{ color: getDeadlineColor(nextDeadline.dueDate) }} />
                <span className="text-caption" style={{ fontWeight: 600 }}>Ближайший дедлайн</span>
              </div>
              <p className="heading-sm" style={{ marginBottom: 4 }}>{nextDeadline.title}</p>
              <span className="text-xs" style={{ color: getDeadlineColor(nextDeadline.dueDate) }}>
                {new Date(nextDeadline.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}

          <div className="card card-enter card-enter-5" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="stat-icon" style={{ background: "var(--violet-light)", color: "var(--violet)", width: 28, height: 28 }}>
                  <ListTodo className="h-3.5 w-3.5" />
                </div>
                <span className="text-caption" style={{ fontWeight: 600 }}>Привычки</span>
              </div>
              <Link href="/habits" className="btn btn-ghost btn-sm" style={{ padding: "0 6px", height: 24, fontSize: 11 }}>
                Все <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="stat-value tabular" style={{ fontSize: 24, color: doneHabits === habits.length && habits.length > 0 ? "var(--success)" : "var(--text)" }}>
                {doneHabits}/{habits.length}
              </div>
              <div className="stat-label">выполнено сегодня</div>
            </div>
          </div>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="card card-enter card-enter-6" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                <FolderKanban className="h-4 w-4" />
              </div>
              <h2 className="heading-md">Проекты</h2>
            </div>
            <Link href="/projects" className="btn btn-ghost btn-sm"><ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {projects.slice(0, 4).map((project: any) => {
              const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
              const done = projectTasks.filter((t: any) => t.status === "done").length;
              const total = projectTasks.length;
              const pct = total > 0 ? Math.round(done / total * 100) : 0;
              return (
                <Link key={project.id} href="/projects" style={{ padding: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", textDecoration: "none", transition: "all 0.15s ease-out", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <p className="heading-sm" style={{ marginBottom: 8 }}>{project.name}</p>
                  <div className="progress" style={{ marginBottom: 6 }}><div className="progress-fill progress-fill-primary" style={{ width: `${pct}%` }} /></div>
                  <span className="text-xs tabular">{done}/{total} задач</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 className="heading-lg">Виджеты</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(true)}>
            <ListTodo className="h-3.5 w-3.5" /> Настроить
          </button>
        </div>
        {loaded && <WidgetRenderer config={widgetConfig} />}
      </div>

      <WidgetEditor open={editorOpen} onClose={() => setEditorOpen(false)} onChange={handleConfigChange} />
    </div>
  );
}
