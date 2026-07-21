"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Task,
  CreateTaskInput,
  TaskStatus,
  TaskPriority,
} from "@/types/task";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  CheckCircle,
  Clock,
  ListTodo,
  AlertTriangle,
  Trash2,
  ArrowUpDown,
  BookTemplate,
} from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

type SortBy = "date" | "priority" | "name" | "created";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TasksPageDesktop() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("created");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(
        data.map(
          (
            t: Task & {
              tags: string;
              repeat_rule: string | null;
              label: string | null;
            }
          ) => ({
            ...t,
            tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
            repeatRule: t.repeat_rule || t.repeatRule || null,
            label: t.label || null,
          })
        )
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      setTemplates(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, [fetchTasks, fetchTemplates]);

  const shortcuts = useMemo(
    () => ({
      "ctrl+n": () => {
        setEditingTask(undefined);
        setFormOpen(true);
      },
      "ctrl+k": () => {
        document
          .querySelector<HTMLInputElement>("[data-search]")
          ?.focus();
      },
      escape: () => {
        setFormOpen(false);
        setDetailTask(null);
        setShowBulkBar(false);
        setSelectedIds(new Set());
      },
    }),
    []
  );

  useKeyboardShortcuts(shortcuts);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortBy === "priority")
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "name") return a.title.localeCompare(b.title, "ru");
      if (sortBy === "date") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [tasks, sortBy]);

  const filteredTasks = sortedTasks.filter((task) => {
    const matchSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleCreate = async (data: CreateTaskInput) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const handleUpdate = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setShowBulkBar(next.size > 0);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
      setShowBulkBar(false);
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
      setShowBulkBar(true);
    }
  };

  const bulkAction = async (action: string, value?: string) => {
    const ids = Array.from(selectedIds);
    await fetch("/api/tasks/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, value }),
    });
    setSelectedIds(new Set());
    setShowBulkBar(false);
    fetchTasks();
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: templateName.trim(),
        tasks: selectedTasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          label: t.label,
        })),
      }),
    });
    setTemplateName("");
    fetchTemplates();
  };

  const applyTemplate = async (template: any) => {
    const templateTasks = JSON.parse(template.tasks);
    for (const t of templateTasks) {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.title,
          description: t.description,
          priority: t.priority,
          label: t.label,
        }),
      });
    }
    fetchTasks();
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter(
      (t) => t.priority === "urgent" && t.status !== "done"
    ).length,
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-[var(--secondary)]">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Задачи"
        description={`Всего: ${stats.total} · Активных: ${stats.todo + stats.inProgress}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <BookTemplate className="h-4 w-4" /> Шаблоны
            </Button>
            <Button
              onClick={() => {
                setEditingTask(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Новая задача
            </Button>
          </div>
        }
      />

      <main className="p-6">
        {showTemplates && (
          <Card className="mb-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Название шаблона"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                />
                <Button
                  size="sm"
                  onClick={saveAsTemplate}
                  disabled={selectedIds.size === 0 || !templateName.trim()}
                >
                  Сохранить выбранные ({selectedIds.size})
                </Button>
              </div>
              {templates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                    >
                      <button
                        onClick={() => applyTemplate(t)}
                        className="hover:text-[var(--accent)]"
                      >
                        {t.name}
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/templates?id=${t.id}`, {
                            method: "DELETE",
                          });
                          fetchTemplates();
                        }}
                        className="ml-1 text-[var(--error)] text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showBulkBar && (
          <Card className="mb-4 border-[var(--accent)]/30">
            <CardContent className="flex items-center gap-3 p-3">
              <span className="text-sm text-[var(--secondary)]">
                Выбрано: {selectedIds.size}
              </span>
              <Button size="sm" variant="outline" onClick={selectAll}>
                {selectedIds.size === filteredTasks.length
                  ? "Снять выделение"
                  : "Выбрать все"}
              </Button>
              <select
                onChange={(e) => {
                  if (e.target.value) bulkAction("status", e.target.value);
                  e.target.value = "";
                }}
                className="h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
              >
                <option value="">Статус...</option>
                <option value="todo">К выполнению</option>
                <option value="in_progress">В работе</option>
                <option value="done">Выполнено</option>
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) bulkAction("priority", e.target.value);
                  e.target.value = "";
                }}
                className="h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
              >
                <option value="">Приоритет...</option>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => bulkAction("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" /> Удалить
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedIds(new Set());
                  setShowBulkBar(false);
                }}
              >
                Отмена
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <ListTodo className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-2xl font-bold">{stats.todo}</p>
                <p className="text-xs text-[var(--secondary)]">К выполнению</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-[var(--warning)]" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-[var(--secondary)]">В работе</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-[var(--success)]" />
              <div>
                <p className="text-2xl font-bold">{stats.done}</p>
                <p className="text-xs text-[var(--secondary)]">Выполнено</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-[var(--error)]" />
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-[var(--secondary)]">Срочных</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TaskFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            priority={priorityFilter}
            onPriorityChange={setPriorityFilter}
          />
          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-[var(--secondary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
            >
              <option value="created">По дате создания</option>
              <option value="date">По дедлайну</option>
              <option value="priority">По приоритету</option>
              <option value="name">По названию</option>
            </select>
            {!showBulkBar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBulkBar(true);
                }}
              >
                Выбрать
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                <ListTodo className="mb-3 h-10 w-10 opacity-50" />
                <p>Задач пока нет</p>
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => {
                    setEditingTask(undefined);
                    setFormOpen(true);
                  }}
                >
                  Создать первую задачу
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onClick={(t) => {
                  if (!showBulkBar) setDetailTask(t);
                }}
                selected={selectedIds.has(task.id)}
                onSelect={toggleSelect}
                showCheckbox={showBulkBar}
              />
            ))
          )}
        </div>
      </main>

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(undefined);
        }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        initialData={editingTask}
      />
      <TaskDetail
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
      />
    </>
  );
}
