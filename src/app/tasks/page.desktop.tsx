"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLang } from "@/lib/i18n/context";
import { Task, CreateTaskInput, TaskStatus, TaskPriority } from "@/types/task";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskFilters } from "@/components/tasks/task-filters";
import { CalendarView } from "@/components/tasks/calendar-view";
import {
  Plus, CheckCircle, Clock, ListTodo, AlertTriangle, Trash2,
  ArrowUpDown, CalendarDays, List, Search, X, Pencil,
} from "lucide-react";

type SortBy = "date" | "priority" | "name" | "created";
type ViewMode = "list" | "calendar";

const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

interface Project { id: string; name: string; emoji: string | null; color: string | null; }

export function TasksPageDesktop() {
  const { t } = useLang();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [labelFilter, setLabelFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    if (Array.isArray(data)) setProjects(data);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const url = selectedProject ? `/api/tasks?projectId=${selectedProject}&t=${Date.now()}` : `/api/tasks?t=${Date.now()}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data.map((t: Task & { tags: string; repeat_rule: string | null; label: string | null }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
        repeatRule: t.repeat_rule || t.repeatRule || null,
        label: t.label || null,
      })));
    } catch {} finally { setLoading(false); }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, [fetchProjects, fetchTasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "name") return a.title.localeCompare(b.title, "ru");
      if (sortBy === "date") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, sortBy]);

  const filteredTasks = sortedTasks.filter((task) => {
    const matchSearch = !search || task.title.toLowerCase().includes(search.toLowerCase()) || task.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || task.status === statusFilter;
    const matchPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchLabel = !labelFilter || task.label === labelFilter;
    const matchProject = !projectFilter || task.projectId === projectFilter;
    return matchSearch && matchStatus && matchPriority && matchLabel && matchProject;
  });

  const handleCreate = async (data: CreateTaskInput) => { await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); await fetchTasks(); };
  const handleUpdate = async (data: CreateTaskInput) => { if (!editingTask) return; await fetch(`/api/tasks/${editingTask.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); await fetchTasks(); };
  const handleDelete = async (id: string) => { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); await fetchTasks(); };
  const handleStatusChange = async (id: string, status: TaskStatus) => { await fetch(`/api/tasks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); fetchTasks(); };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); setShowBulkBar(next.size > 0); return next; });
  };
  const selectAll = () => {
    if (selectedIds.size === filteredTasks.length) { setSelectedIds(new Set()); setShowBulkBar(false); }
    else { setSelectedIds(new Set(filteredTasks.map(t => t.id))); setShowBulkBar(true); }
  };
  const bulkAction = async (action: string, value?: string) => {
    await fetch("/api/tasks/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selectedIds), action, value }) });
    setSelectedIds(new Set()); setShowBulkBar(false); fetchTasks();
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
    urgent: tasks.filter(t => t.priority === "urgent" && t.status !== "done").length,
  };

  const priorityColor = (p: string) => p === "urgent" ? "var(--error)" : p === "high" ? "var(--warning)" : p === "medium" ? "var(--primary)" : "var(--mint)";

  if (loading) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <div className="empty-state" style={{ minHeight: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className="text-muted" style={{ marginTop: 12 }}>Загрузка задач...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="heading-xl" style={{ marginBottom: 4 }}>{t("tasks_title")}</h1>
        <p className="text-body">Всего: {stats.total} · Активных: {stats.todo + stats.inProgress} · Срочных: {stats.urgent}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--bg-alt)", color: "var(--text-secondary)" }}><ListTodo className="h-4 w-4" /></div>
          <div><div className="stat-value" style={{ fontSize: 20 }}>{stats.todo}</div><div className="stat-label">К выполнению</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}><Clock className="h-4 w-4" /></div>
          <div><div className="stat-value" style={{ fontSize: 20 }}>{stats.inProgress}</div><div className="stat-label">В работе</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}><CheckCircle className="h-4 w-4" /></div>
          <div><div className="stat-value" style={{ fontSize: 20 }}>{stats.done}</div><div className="stat-label">Готово</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(239,68,68,0.08)", color: "var(--error)" }}><AlertTriangle className="h-4 w-4" /></div>
          <div><div className="stat-value" style={{ fontSize: 20 }}>{stats.urgent}</div><div className="stat-label">Срочно</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input" style={{ width: "auto", minWidth: 200 }}>
            <option value="">Все задачи</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="input-group" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <div className="input-icon"><Search className="h-4 w-4" /></div>
            <input data-search placeholder="Поиск задач..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} className="btn-icon btn-icon-sm" style={{ marginRight: 4 }}><X className="h-3.5 w-3.5" /></button>}
          </div>

          <div className="pill-nav">
            <button onClick={() => setViewMode("list")} className={`pill-nav-item ${viewMode === "list" ? "pill-nav-item-active" : ""}`}><List className="h-3.5 w-3.5" /> Список</button>
            <button onClick={() => setViewMode("calendar")} className={`pill-nav-item ${viewMode === "calendar" ? "pill-nav-item-active" : ""}`}><CalendarDays className="h-3.5 w-3.5" /> Календарь</button>
          </div>

          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="input" style={{ width: "auto", minWidth: 160 }}>
            <option value="created">По дате создания</option>
            <option value="date">По дедлайну</option>
            <option value="priority">По приоритету</option>
            <option value="name">По названию</option>
          </select>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => { setEditingTask(undefined); setFormOpen(true); }} className="btn btn-primary"><Plus className="h-4 w-4" /> Новая задача</button>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {showBulkBar && (
        <div className="card" style={{ padding: 12, marginBottom: 16, borderColor: "var(--primary)", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="text-caption" style={{ fontWeight: 600 }}>Выбрано: {selectedIds.size}</span>
          <button onClick={selectAll} className="btn btn-outline btn-sm">{selectedIds.size === filteredTasks.length ? "Снять" : "Все"}</button>
          <select onChange={e => { if (e.target.value) bulkAction("status", e.target.value); e.target.value = ""; }} className="input" style={{ width: "auto", height: 32, fontSize: 12 }}>
            <option value="">Статус...</option>
            <option value="todo">К выполнению</option>
            <option value="in_progress">В работе</option>
            <option value="done">Готово</option>
          </select>
          <button onClick={() => bulkAction("delete")} className="btn btn-outline btn-sm" style={{ color: "var(--error)", borderColor: "var(--error)" }}><Trash2 className="h-3 w-3" /></button>
          <button onClick={() => { setSelectedIds(new Set()); setShowBulkBar(false); }} className="btn btn-ghost btn-sm">Отмена</button>
        </div>
      )}

      {/* Tasks */}
      {viewMode === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 64 }}>
              <div className="empty-state-icon"><ListTodo className="h-8 w-8" /></div>
              <p className="empty-state-title">Нет задач</p>
              <p className="empty-state-desc" style={{ marginBottom: 16 }}>Создай первую задачу, чтобы начать</p>
              <button onClick={() => { setEditingTask(undefined); setFormOpen(true); }} className="btn btn-primary"><Plus className="h-4 w-4" /> Создать задачу</button>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="task-item" onClick={() => { if (!showBulkBar) setDetailTask(task); else toggleSelect(task.id); }}>
                {showBulkBar && (
                  <div onClick={e => { e.stopPropagation(); toggleSelect(task.id); }} className="mobile-checkbox" style={{
                    background: selectedIds.has(task.id) ? "var(--primary)" : "var(--surface)",
                    borderColor: selectedIds.has(task.id) ? "var(--primary)" : "var(--border)",
                    color: selectedIds.has(task.id) ? "white" : "transparent",
                  }}>✓</div>
                )}
                <div className="task-item-priority" style={{ background: priorityColor(task.priority) }} />
                <div className="task-item-content">
                  <div className={`task-item-title ${task.status === "done" ? "task-item-title-done" : ""}`}>{task.title}</div>
                  <div className="task-item-meta">
                    {task.dueDate && <span className="text-xs" style={{ color: new Date(task.dueDate) < new Date() && task.status !== "done" ? "var(--error)" : "var(--text-muted)" }}>{new Date(task.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}
                    {task.label && <span className="badge badge-outline" style={{ height: 20, fontSize: 10, padding: "0 6px" }}>{task.label}</span>}
                    {task.projectId && <span className="badge badge-primary" style={{ height: 20, fontSize: 10, padding: "0 6px" }}>{projects.find(p => p.id === task.projectId)?.name || "Проект"}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5" style={{ flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); setEditingTask(task); setFormOpen(true); }} className="btn-icon btn-icon-sm"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(task.id); }} className="btn-icon btn-icon-sm" style={{ color: "var(--error)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                  {task.status !== "done" && <button onClick={e => { e.stopPropagation(); handleStatusChange(task.id, "done"); }} className="btn btn-mint btn-sm">✓</button>}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <CalendarView tasks={filteredTasks} />
      )}

      <TaskForm open={formOpen} onClose={() => { setFormOpen(false); setEditingTask(undefined); }} onSubmit={editingTask ? handleUpdate : handleCreate} initialData={editingTask} defaultProjectId={selectedProject} />
      <TaskDetail task={detailTask} open={!!detailTask} onClose={() => setDetailTask(null)} />
    </div>
  );
}
