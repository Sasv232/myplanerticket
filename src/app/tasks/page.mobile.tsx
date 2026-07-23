"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import { SwipeableTaskCard } from "@/components/ui/swipeable-card";
import {
  Plus,
  Search,
  Check,
  Calendar,
  Repeat,
  X,
  Home,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useAuth } from "@/lib/auth-context";

const PRIORITY_BADGE: Record<string, { label: string; variant: "urgent" | "high" | "medium" | "low" }> = {
  urgent: { label: "Срочно", variant: "urgent" },
  high: { label: "Высокий", variant: "high" },
  medium: { label: "Средний", variant: "medium" },
  low: { label: "Низкий", variant: "low" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "todo", label: "К выполнению" },
  { key: "in_progress", label: "В работе" },
  { key: "done", label: "Выполнено" },
];

export function TasksPageMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; emoji: string | null }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const { setOpen } = useMobileSidebar();
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    if (Array.isArray(data)) setProjects(data);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const url = selectedProject
        ? `/api/tasks?projectId=${selectedProject}&t=${Date.now()}`
        : `/api/tasks?t=${Date.now()}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data.map((t: Task & { tags: string }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
      })));
    } catch {} finally { setLoading(false); }
  }, [selectedProject]);

  useEffect(() => { fetchProjects(); fetchTasks(); }, [fetchProjects, fetchTasks]);

  const filtered = tasks.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleStatus = useCallback(async (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch { fetchTasks(); }
  }, [fetchTasks]);

  const handleCreate = useCallback(async (data: { title: string; description?: string; priority?: TaskPriority; dueDate?: string; tags?: string[]; repeatRule?: string; label?: string; projectId?: string; emoji?: string }) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newTask = await res.json();
      setTasks((prev) => [...prev, { ...newTask, tags: newTask.tags ? JSON.parse(newTask.tags) : [] }]);
    } catch { fetchTasks(); }
    setFormOpen(false);
  }, [fetchTasks]);

  const handleUpdate = useCallback(async (data: { title: string; description?: string; priority?: TaskPriority; dueDate?: string; tags?: string[]; repeatRule?: string; label?: string; projectId?: string; emoji?: string }) => {
    if (!editTask) return;
    try {
      const res = await fetch(`/api/tasks/${editTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => t.id === editTask.id ? { ...updated, tags: updated.tags ? JSON.parse(updated.tags) : [] } : t));
    } catch { fetchTasks(); }
    setFormOpen(false);
    setEditTask(undefined);
  }, [editTask, fetchTasks]);

  const handleDelete = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); } catch { fetchTasks(); }
    setDetailTask(null);
  }, [fetchTasks]);

  return (
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-6 w-6 rounded-lg object-cover" />
              ) : (
                <span className="text-xs font-bold text-[var(--accent)]">M</span>
              )}
            </button>
            <Link href="/" className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150">
              <Home className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">Задачи</h1>
          </div>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="h-10 w-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150"
          >
            {searchOpen ? <X className="h-5 w-5 text-[var(--secondary)]" /> : <Search className="h-5 w-5 text-[var(--secondary)]" />}
          </button>
        </div>

        {searchOpen && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Поиск задач..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mobile-input"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`mobile-pill ${filter === f.key ? "mobile-pill-active" : "mobile-pill-inactive"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="">Все задачи (личные + проекты)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji || "📁"} {p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="p-5 space-y-3">
        {loading ? (
          <div className="py-20 text-center text-[var(--secondary)] text-base">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-semibold mb-1">Нет задач</p>
            <p className="text-sm text-[var(--secondary)]">Нажмите + чтобы создать</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.03 }}
              >
                <SwipeableTaskCard
                  onComplete={() => toggleStatus(task.id, task.status === "done" ? "todo" : "done")}
                  onDelete={() => handleDelete(task.id)}
                >
                  <div
                    onClick={() => setDetailTask(task)}
                    className="mobile-task-card p-5 flex items-start gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(task.id, task.status === "done" ? "todo" : "done");
                      }}
                      className={`mt-0.5 mobile-checkbox ${task.status === "done" ? "mobile-checkbox-checked" : ""}`}
                    >
                      {task.status === "done" && <Check className="h-4 w-4" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {task.emoji && <span className="text-base">{task.emoji}</span>}
                        <p className={`text-base font-semibold truncate ${task.status === "done" ? "line-through opacity-50" : ""}`}>
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant={PRIORITY_BADGE[task.priority]?.variant || "medium"} className="text-[10px] px-2.5 py-0.5">
                          {PRIORITY_BADGE[task.priority]?.label || task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-xs text-[var(--secondary)]">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        {task.repeatRule && (
                          <Repeat className="h-3 w-3 text-[var(--muted)]" />
                        )}
                        {task.assigneeName && (
                          <span className="flex items-center gap-1 text-xs text-[var(--accent)] font-medium">
                            <User className="h-3 w-3" />
                            {task.assigneeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </SwipeableTaskCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setEditTask(undefined); setFormOpen(true); }} className="mobile-fab">
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTask(undefined); }}
        onSubmit={editTask ? handleUpdate : handleCreate}
        initialData={editTask}
        defaultProjectId={selectedProject}
      />
      {detailTask && (
        <TaskDetail
          task={detailTask}
          open={!!detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  );
}
