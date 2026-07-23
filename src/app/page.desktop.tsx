"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { useLang } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Clock, FolderKanban, Repeat, Zap, BarChart3,
  Settings, ArrowRight, TrendingUp, ListTodo, Calendar,
} from "lucide-react";
import Link from "next/link";

export function DashboardPageDesktop() {
  const { user } = useAuth();
  const { t } = useLang();
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

  const todayTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === now.toDateString();
  });
  const activeTasks = tasks.filter((t: any) => t.status !== "done");
  const completedTasks = tasks.filter((t: any) => t.status === "done");
  const urgentTasks = tasks.filter((t: any) => t.priority === "urgent" && t.status !== "done");
  const doneHabits = habits.filter((h: any) => h.completedToday).length;

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Row 1: Welcome + Quick Actions */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {/* Welcome */}
        <div className="dash-grid-2" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="badge badge-primary" style={{ marginBottom: 12, width: "fit-content" }}>
            <Zap className="h-3 w-3" /> Планер
          </div>
          <h1 className="heading-xl" style={{ marginBottom: 4 }}>
            {greeting}, {user?.name?.split(" ")[0] || ""} 👋
          </h1>
          <p className="text-body" style={{ maxWidth: 400 }}>
            Вот что у тебя на сегодня. Управляй задачами и отслеживай прогресс.
          </p>
        </div>

        {/* Quick stats */}
        <div className="stat-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <div className="flex items-center gap-2">
            <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)", width: 36, height: 36, borderRadius: "var(--radius-sm)" }}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <span className="stat-label">Готово сегодня</span>
          </div>
          <span className="stat-value">{completedTasks.length}</span>
        </div>

        <div className="stat-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <div className="flex items-center gap-2">
            <div className="stat-icon" style={{ background: "var(--mint-light)", color: "var(--mint)", width: 36, height: 36, borderRadius: "var(--radius-sm)" }}>
              <Clock className="h-4 w-4" />
            </div>
            <span className="stat-label">Активных</span>
          </div>
          <span className="stat-value">{activeTasks.length}</span>
        </div>
      </div>

      {/* Row 2: Stats + Active Tasks */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {/* Stats overview */}
        <div className="card" style={{ padding: 20, gridColumn: "span 2" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-md">Статистика</h2>
            <Link href="/stats" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              Подробнее <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="stat-card" style={{ padding: 14 }}>
              <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)", width: 40, height: 40 }}>
                <ListTodo className="h-4 w-4" />
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: 20 }}>{todayTasks.length}</div>
                <div className="stat-label">На сегодня</div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: 14 }}>
              <div className="stat-icon" style={{ background: "rgba(239,68,68,0.08)", color: "var(--error)", width: 40, height: 40 }}>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: 20 }}>{urgentTasks.length}</div>
                <div className="stat-label">Срочных</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span className="text-xs">Прогресс</span>
              <span className="text-xs">{tasks.length > 0 ? Math.round(completedTasks.length / tasks.length * 100) : 0}%</span>
            </div>
            <div className="progress">
              <div className="progress-fill progress-fill-primary" style={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length * 100) : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Active tasks */}
        <div className="card" style={{ padding: 20, gridColumn: "span 2" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-md">Активные задачи</h2>
            <Link href="/tasks" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeTasks.slice(0, 4).map((task: any) => (
              <div key={task.id} className="task-item" onClick={() => router.push("/tasks")}>
                <div className="task-item-priority" style={{
                  background: task.priority === "urgent" ? "var(--error)" :
                    task.priority === "high" ? "var(--warning)" :
                    task.priority === "medium" ? "var(--primary)" : "var(--mint)"
                }} />
                <div className="task-item-content">
                  <div className="task-item-title">{task.title}</div>
                  <div className="task-item-meta">
                    {task.dueDate && (
                      <span className="text-xs" style={{
                        color: new Date(task.dueDate) < now ? "var(--error)" : "var(--text-muted)"
                      }}>
                        {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    <span className={`badge badge-${task.priority === "urgent" ? "error" : task.priority === "high" ? "warning" : "primary"}`} style={{ height: 20, fontSize: 10, padding: "0 6px" }}>
                      {task.priority === "urgent" ? "Срочно" : task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {activeTasks.length === 0 && (
              <div className="empty-state" style={{ padding: "24px 16px" }}>
                <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                  <CheckCircle className="h-6 w-6" />
                </div>
                <p className="empty-state-title" style={{ fontSize: 14 }}>Все задачи выполнены!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Habits + Timer + Projects */}
      <div className="dash-grid">
        {/* Habits */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="heading-md">Привычки</h2>
            <Link href="/habits" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="stat-value" style={{ fontSize: 32, color: "var(--mint)" }}>{doneHabits}/{habits.length}</div>
            <div className="stat-label">выполнено сегодня</div>
          </div>
          <div className="progress">
            <div className="progress-fill progress-fill-mint" style={{ width: `${habits.length > 0 ? (doneHabits / habits.length * 100) : 0}%` }} />
          </div>
        </div>

        {/* Pomodoro */}
        <Link href="/pomodoro" className="card card-interactive" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", gap: 12 }}>
          <div className="stat-icon" style={{
            background: "var(--gradient-primary)", color: "white", width: 56, height: 56, borderRadius: "var(--radius-lg)",
            boxShadow: "0 4px 12px var(--primary-glow)",
          }}>
            <Zap className="h-6 w-6" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p className="heading-md">Таймер</p>
            <p className="text-muted" style={{ marginTop: 2 }}>Фокусировка</p>
          </div>
        </Link>

        {/* Projects */}
        <Link href="/projects" className="card card-interactive" style={{ padding: 20, textDecoration: "none", gridColumn: "span 2" }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
            <div className="stat-icon" style={{ background: "var(--mint-light)", color: "var(--mint)" }}>
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="heading-md">Проекты</h2>
              <p className="text-muted">Командная работа</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="stat-card" style={{ flex: 1, padding: 12 }}>
              <div>
                <div className="stat-value" style={{ fontSize: 18 }}>{tasks.filter((t: any) => t.projectId).length}</div>
                <div className="stat-label">В проектах</div>
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: 12 }}>
              <div>
                <div className="stat-value" style={{ fontSize: 18 }}>{tasks.filter((t: any) => !t.projectId).length}</div>
                <div className="stat-label">Личных</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Widget Editor */}
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-outline" onClick={() => setEditorOpen(true)}>
          <Settings className="h-4 w-4" /> Настроить виджеты
        </button>
      </div>
      <WidgetEditor open={editorOpen} onClose={() => setEditorOpen(false)} onChange={handleConfigChange} />
    </div>
  );
}
