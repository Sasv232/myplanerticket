"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import {
  Plus,
  Search,
  Filter,
  Check,
  Calendar,
  Repeat,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const { setOpen } = useMobileSidebar();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.map((t: Task & { tags: string }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
      })));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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
      <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform">
              <span className="text-sm font-bold text-[var(--accent)]">M</span>
            </button>
            <p className="text-lg font-bold">Задачи</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="h-9 w-9 rounded-xl bg-[var(--surface)] flex items-center justify-center">
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <input
            type="text"
            placeholder="Поиск задач..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input text-sm mb-2"
            autoFocus
          />
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--secondary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="mobile-content">
        {loading ? (
          <div className="py-20 text-center text-[var(--secondary)] text-sm">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-semibold mb-1">Нет задач</p>
            <p className="text-sm text-[var(--secondary)]">Нажмите + чтобы создать</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setDetailTask(task)}
                  className="mobile-task-card p-3.5 flex items-start gap-3 active:scale-[0.98] transition-transform"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(task.id, task.status === "done" ? "todo" : "done");
                    }}
                    className={`mt-0.5 h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${
                      task.status === "done"
                        ? "bg-[var(--success)] border-[var(--success)] text-white"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {task.status === "done" && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {task.emoji && <span className="text-sm">{task.emoji}</span>}
                      <p className={`text-[14px] font-semibold truncate ${task.status === "done" ? "line-through opacity-50" : ""}`}>
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={PRIORITY_BADGE[task.priority]?.variant || "medium"} className="text-[9px]">
                        {PRIORITY_BADGE[task.priority]?.label || task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[var(--secondary)]">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {task.repeatRule && (
                        <Repeat className="h-2.5 w-2.5 text-[var(--muted)]" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
