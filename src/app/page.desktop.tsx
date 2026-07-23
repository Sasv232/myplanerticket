"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { WidgetConfig, loadWidgetConfig } from "@/lib/widgets";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { WidgetEditor } from "@/components/widgets/widget-editor";
import { TagBadge } from "@/components/ui/tag-badge";
import { Settings, Sparkles, Zap, CheckCircle, Clock, FolderKanban, Repeat, BarChart3 } from "lucide-react";
import Link from "next/link";

export function DashboardPageDesktop() {
  const { user } = useAuth();
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
    const d = new Date(t.dueDate);
    return d.toDateString() === now.toDateString();
  });
  const activeTasks = tasks.filter((t: any) => t.status !== "done");
  const completedToday = tasks.filter((t: any) => t.status === "done").length;
  const doneHabits = habits.filter((h: any) => h.completedToday).length;

  return (
    <div className="blob-bg min-h-screen" style={{ padding: "40px 48px" }}>
      {/* Hero */}
      <div className="mb-10" style={{ maxWidth: 700 }}>
        <TagBadge variant="green" className="mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Персональный планер
        </TagBadge>
        <h1 className="heading-xl mb-3">
          {greeting}, {user?.name?.split(" ")[0] || ""} 👋
        </h1>
        <p className="text-body" style={{ color: "var(--text-secondary)", maxWidth: 500 }}>
          Вот что у тебя на сегодня. Нажимай на карточки — каждая интерактивна.
        </p>
      </div>

      {/* Летающие карточки — PSP XMB стиль */}
      <div className="relative" style={{ minHeight: 500 }}>
        {/* Карточка 1 — Задачи на сегодня (большая) */}
        <Link href="/tasks" className="absolute dash-float dash-float-1" style={{ top: 0, left: 0, width: 340 }}>
          <div className="dash-glass p-6">
            <div className="gradient-ring gradient-ring-1" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-pulse" style={{ background: "var(--gradient-accent)" }}>
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-caption" style={{ fontWeight: 600 }}>Задачи на сегодня</p>
                <p className="heading-lg" style={{ lineHeight: 1 }}>{todayTasks.length}</p>
              </div>
            </div>
            <div className="space-y-2">
              {todayTasks.slice(0, 3).map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "var(--bg-alt)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: t.priority === "urgent" ? "var(--error)" : t.priority === "high" ? "var(--warning)" : "var(--green)" }} />
                  <span className="text-sm truncate">{t.title}</span>
                </div>
              ))}
              {todayTasks.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Нет задач на сегодня</p>}
            </div>
          </div>
        </Link>

        {/* Карточка 2 — Активные задачи (средняя, смещена) */}
        <Link href="/tasks" className="absolute dash-float dash-float-2" style={{ top: 20, left: 380, width: 260 }}>
          <div className="dash-glass p-5">
            <div className="gradient-ring gradient-ring-2" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-pulse-delay wiggle" style={{ background: "var(--blue-light)" }}>
                <Clock className="h-5 w-5" style={{ color: "var(--blue)" }} />
              </div>
              <div>
                <p className="text-caption" style={{ fontWeight: 600 }}>Активных</p>
                <p className="heading-md" style={{ lineHeight: 1 }}>{activeTasks.length}</p>
              </div>
            </div>
            <div className="progress-bar mt-3">
              <div className="progress-bar-fill" style={{ width: `${tasks.length > 0 ? (completedToday / tasks.length * 100) : 0}%` }} />
            </div>
            <p className="text-muted mt-2">выполнено: {completedToday}/{tasks.length}</p>
          </div>
        </Link>

        {/* Карточка 3 — Проекты (маленькая, выше) */}
        <Link href="/projects" className="absolute dash-float dash-float-3" style={{ top: -10, left: 680, width: 220 }}>
          <div className="dash-glass p-5 bounce-click">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-pulse-delay2" style={{ background: "rgba(168,85,247,0.1)" }}>
              <FolderKanban className="h-5 w-5" style={{ color: "var(--purple)" }} />
            </div>
            <p className="text-caption mt-3" style={{ fontWeight: 600 }}>Проекты</p>
            <p className="heading-md mt-1" style={{ lineHeight: 1 }}>Открыть</p>
          </div>
        </Link>

        {/* Карточка 4 — Привычки (средняя, ниже) */}
        <Link href="/habits" className="absolute dash-float dash-float-4" style={{ top: 220, left: 40, width: 300 }}>
          <div className="dash-glass p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-pulse wiggle" style={{ background: "var(--green-light)" }}>
                <Repeat className="h-5 w-5" style={{ color: "var(--green)" }} />
              </div>
              <div>
                <p className="text-caption" style={{ fontWeight: 600 }}>Привычки сегодня</p>
                <p className="heading-md" style={{ lineHeight: 1 }}>{doneHabits}/{habits.length}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3">
              {habits.slice(0, 7).map((h: any) => (
                <div
                  key={h.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bounce-click"
                  style={{
                    background: h.completedToday ? "var(--gradient-green)" : "var(--bg-alt)",
                    color: h.completedToday ? "white" : "var(--text-muted)",
                    boxShadow: h.completedToday ? "0 2px 8px rgba(34,197,94,0.3)" : "none",
                  }}
                >
                  {h.completedToday ? "✓" : "·"}
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Карточка 5 — Таймер (маленькая, справа) */}
        <Link href="/pomodoro" className="absolute dash-float dash-float-5" style={{ top: 200, left: 380, width: 200 }}>
          <div className="dash-glass p-5 bounce-click" style={{ textAlign: "center" }}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center icon-pulse" style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 20px var(--accent-glow)" }}>
              <Zap className="h-7 w-7 text-white" />
            </div>
            <p className="heading-sm mt-3">Таймер</p>
            <p className="text-muted text-xs mt-1">Фокусировка</p>
          </div>
        </Link>

        {/* Карточка 6 — Статистика (широкая, внизу) */}
        <Link href="/stats" className="absolute dash-float dash-float-1" style={{ top: 340, left: 40, width: 400 }}>
          <div className="dash-glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-pulse-delay" style={{ background: "rgba(255,107,53,0.1)" }}>
                <BarChart3 className="h-5 w-5" style={{ color: "var(--orange)" }} />
              </div>
              <p className="text-caption" style={{ fontWeight: 600 }}>Статистика недели</p>
            </div>
            <div className="flex gap-4">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-lg bounce-click"
                    style={{
                      height: `${20 + Math.random() * 60}px`,
                      background: i === new Date().getDay() - 1 ? "var(--gradient-green)" : "var(--bg-alt)",
                      minHeight: 20,
                    }}
                  />
                  <span className="text-muted text-[10px]">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Карточка 7 — Мессенджер (маленькая, плавающая) */}
        <Link href="/messenger" className="absolute dash-float dash-float-3" style={{ top: 350, left: 480, width: 180 }}>
          <div className="dash-glass p-4 bounce-click" style={{ textAlign: "center" }}>
            <div className="text-3xl mb-2">💬</div>
            <p className="heading-sm">Чат</p>
            <p className="text-muted text-xs mt-1">Сообщения</p>
          </div>
        </Link>

        {/* Карточка 8 — Фитнес */}
        <Link href="/fitness" className="absolute dash-float dash-float-4" style={{ top: 420, left: 700, width: 180 }}>
          <div className="dash-glass p-4 bounce-click" style={{ textAlign: "center" }}>
            <div className="text-3xl mb-2 wiggle">🏋️</div>
            <p className="heading-sm">Фитнес</p>
            <p className="text-muted text-xs mt-1">Тренировки</p>
          </div>
        </Link>
      </div>

      {/* Настройка виджетов */}
      <div className="mt-8">
        <button className="pill-btn pill-btn-outline" onClick={() => setEditorOpen(true)}>
          <Settings className="h-4 w-4" />
          Настроить виджеты
        </button>
      </div>

      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onChange={handleConfigChange}
      />
    </div>
  );
}
