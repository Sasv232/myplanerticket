"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, CreateTaskInput, TaskStatus, TaskPriority } from "@/types/task";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CheckCircle, Clock, ListTodo, AlertTriangle } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(
        data.map((t: Task & { tags: string }) => ({
          ...t,
          tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
        }))
      );
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    const matchSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || task.status === statusFilter;
    const matchPriority = priorityFilter === "all" || task.priority === priorityFilter;
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

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-[var(--secondary)]">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Задачи"
        description={`Всего: ${stats.total} · Активных: ${stats.todo + stats.inProgress}`}
        actions={
          <Button onClick={() => { setEditingTask(undefined); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Новая задача
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      <div className="mt-4 space-y-2">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
              <ListTodo className="mb-3 h-10 w-10 opacity-50" />
              <p>Задач пока нет</p>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => { setEditingTask(undefined); setFormOpen(true); }}
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
              onEdit={(t) => { setEditingTask(t); setFormOpen(true); }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTask(undefined); }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        initialData={editingTask}
      />
    </div>
  );
}
