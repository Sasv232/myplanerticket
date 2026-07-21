"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, CreateTaskInput, TaskStatus, TaskPriority } from "@/types/task";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import {
  Plus,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  FolderKanban,
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PROJECT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6b7280",
];

const PROJECT_EMOJIS = [
  "📁",
  "🎯",
  "💼",
  "🚀",
  "⭐",
  "📊",
  "🔧",
  "🎨",
  "📝",
  "🏠",
  "💡",
  "🎮",
  "📚",
  "🎵",
  "🌟",
  "🔥",
  "💻",
  "📱",
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Выполнено",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function ProjectCardComponent({
  project,
  taskCount,
  onSelect,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md" onClick={onSelect}>
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: project.color }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.emoji}</span>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">{project.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {taskCount} {taskCount === 1 ? "задача" : taskCount < 5 ? "задачи" : "задач"}
              </Badge>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="rounded-lg p-1.5 text-[var(--secondary)] hover:bg-[var(--surface)] transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] rounded-t-lg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Редактировать
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--surface)] rounded-b-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsPageDesktop() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const [projectName, setProjectName] = useState("");
  const [projectEmoji, setProjectEmoji] = useState("📁");
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (projectId?: string) => {
    try {
      const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
      const res = await fetch(url);
      const data = await res.json();
      setTasks(
        data.map(
          (t: Task & { tags: string; repeat_rule: string | null; label: string | null }) => ({
            ...t,
            tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
            repeatRule: t.repeat_rule || t.repeatRule || null,
            label: t.label || null,
          })
        )
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject.id);
      setSearch("");
      setStatusFilter("all");
      setPriorityFilter("all");
    } else {
      fetchTasks();
    }
  }, [selectedProject, fetchTasks]);

  const taskCounts = projects.reduce((acc, project) => {
    acc[project.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.label) {
        counts[task.label] = (counts[task.label] || 0) + 1;
      }
    });
    setProjects((prev) =>
      prev.map((p) => ({ ...p, taskCount: counts[p.id] || 0 }))
    );
  }, [tasks]);

  const filteredTasks = tasks
    .filter((task) => {
      const matchSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || task.status === statusFilter;
      const matchPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName.trim(),
        emoji: projectEmoji,
        color: projectColor,
      }),
    });
    setFormOpen(false);
    setProjectName("");
    setProjectEmoji("📁");
    setProjectColor(PROJECT_COLORS[0]);
    fetchProjects();
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !projectName.trim()) return;
    await fetch(`/api/projects/${editingProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName.trim(),
        emoji: projectEmoji,
        color: projectColor,
      }),
    });
    setFormOpen(false);
    setEditingProject(undefined);
    setProjectName("");
    setProjectEmoji("📁");
    setProjectColor(PROJECT_COLORS[0]);
    fetchProjects();
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject((prev) =>
        prev
          ? { ...prev, name: projectName.trim(), emoji: projectEmoji, color: projectColor }
          : null
      );
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Удалить проект? Задачи не будут удалены.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
    fetchProjects();
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, label: selectedProject?.id }),
    });
    fetchTasks(selectedProject?.id);
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks(selectedProject?.id);
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks(selectedProject?.id);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks(selectedProject?.id);
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
    <>
      <Header
        title={selectedProject ? selectedProject.name : "Проекты"}
        description={
          selectedProject
            ? `${filteredTasks.length} задач`
            : `Всего проектов: ${projects.length}`
        }
        actions={
          selectedProject ? (
            <Button variant="outline" onClick={() => setSelectedProject(null)}>
              <ArrowLeft className="h-4 w-4" />
              Все проекты
            </Button>
          ) : (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Создать проект
            </Button>
          )
        }
      />

      <main className="p-6">
        {selectedProject ? (
          <>
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
              <Button size="sm" onClick={() => setTaskFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Новая задача
              </Button>
            </div>

            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                    <ListTodo className="mb-3 h-10 w-10 opacity-50" />
                    <p>Задач в проекте пока нет</p>
                    <Button
                      variant="ghost"
                      className="mt-2"
                      onClick={() => setTaskFormOpen(true)}
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
                      setTaskFormOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    onClick={(t) => setDetailTask(t)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                  <FolderKanban className="mb-3 h-10 w-10 opacity-50" />
                  <p>Проектов пока нет</p>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setFormOpen(true)}
                  >
                    Создать первый проект
                  </Button>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <ProjectCardComponent
                  key={project.id}
                  project={project}
                  taskCount={tasks.filter((t) => t.label === project.id).length}
                  onSelect={() => setSelectedProject(project)}
                  onEdit={() => {
                    setEditingProject(project);
                    setProjectName(project.name);
                    setProjectEmoji(project.emoji);
                    setProjectColor(project.color);
                    setFormOpen(true);
                  }}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              ))
            )}
          </div>
        )}
      </main>

      <Modal open={formOpen} onOpenChange={setFormOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {editingProject ? "Редактировать проект" : "Новый проект"}
            </ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Название
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Название проекта"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Эмодзи
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setProjectEmoji(emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                      projectEmoji === emoji
                        ? "bg-[var(--accent)]/20 ring-2 ring-[var(--accent)]"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Цвет
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectColor(color)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      projectColor === color
                        ? "ring-2 ring-offset-2 ring-[var(--foreground)]"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--secondary)] mb-2">Предпросмотр</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{projectEmoji}</span>
                <span className="font-medium">
                  {projectName.trim() || "Название проекта"}
                </span>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: projectColor }}
                />
              </div>
            </div>
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Отмена</Button>
            </ModalClose>
            <Button
              onClick={editingProject ? handleUpdateProject : handleCreateProject}
              disabled={!projectName.trim()}
            >
              {editingProject ? "Сохранить" : "Создать"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <TaskForm
        open={taskFormOpen}
        onClose={() => {
          setTaskFormOpen(false);
          setEditingTask(undefined);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
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

function ProjectsPageMobile() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const [projectName, setProjectName] = useState("");
  const [projectEmoji, setProjectEmoji] = useState("📁");
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (projectId?: string) => {
    try {
      const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
      const res = await fetch(url);
      const data = await res.json();
      setTasks(
        data.map(
          (t: Task & { tags: string; repeat_rule: string | null; label: string | null }) => ({
            ...t,
            tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
            repeatRule: t.repeat_rule || t.repeatRule || null,
            label: t.label || null,
          })
        )
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject.id);
      setSearch("");
      setStatusFilter("all");
      setPriorityFilter("all");
    } else {
      fetchTasks();
    }
  }, [selectedProject, fetchTasks]);

  const filteredTasks = tasks
    .filter((task) => {
      const matchSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || task.status === statusFilter;
      const matchPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName.trim(),
        emoji: projectEmoji,
        color: projectColor,
      }),
    });
    setFormOpen(false);
    setProjectName("");
    setProjectEmoji("📁");
    setProjectColor(PROJECT_COLORS[0]);
    fetchProjects();
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !projectName.trim()) return;
    await fetch(`/api/projects/${editingProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName.trim(),
        emoji: projectEmoji,
        color: projectColor,
      }),
    });
    setFormOpen(false);
    setEditingProject(undefined);
    setProjectName("");
    setProjectEmoji("📁");
    setProjectColor(PROJECT_COLORS[0]);
    fetchProjects();
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject((prev) =>
        prev
          ? { ...prev, name: projectName.trim(), emoji: projectEmoji, color: projectColor }
          : null
      );
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Удалить проект? Задачи не будут удалены.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
    fetchProjects();
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, label: selectedProject?.id }),
    });
    fetchTasks(selectedProject?.id);
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks(selectedProject?.id);
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks(selectedProject?.id);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks(selectedProject?.id);
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
    <div className="space-y-4">
      {selectedProject ? (
        <>
          <div className="mobile-page-header">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProject(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {selectedProject.emoji} {selectedProject.name}
                </h1>
                <p className="text-sm text-[var(--secondary)]">
                  {filteredTasks.length} задач
                </p>
              </div>
              <Button size="sm" onClick={() => setTaskFormOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="mobile-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <ListTodo className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.todo}</p>
                    <p className="text-xs text-[var(--secondary)]">К выполнению</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mobile-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10">
                    <Clock className="h-5 w-5 text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                    <p className="text-xs text-[var(--secondary)]">В работе</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mobile-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10">
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.done}</p>
                    <p className="text-xs text-[var(--secondary)]">Выполнено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mobile-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--error)]/10">
                    <AlertTriangle className="h-5 w-5 text-[var(--error)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.urgent}</p>
                    <p className="text-xs text-[var(--secondary)]">Срочных</p>
                  </div>
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

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <Card className="mobile-widget-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                  <ListTodo className="mb-3 h-10 w-10 opacity-50" />
                  <p>Задач в проекте пока нет</p>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setTaskFormOpen(true)}
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
                    setTaskFormOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onClick={(t) => setDetailTask(t)}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mobile-page-header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Проекты</h1>
                <p className="text-sm text-[var(--secondary)]">
                  Всего проектов: {projects.length}
                </p>
              </div>
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <Card className="mobile-widget-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                  <FolderKanban className="mb-3 h-10 w-10 opacity-50" />
                  <p>Проектов пока нет</p>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setFormOpen(true)}
                  >
                    Создать первый проект
                  </Button>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <ProjectCardComponent
                  key={project.id}
                  project={project}
                  taskCount={tasks.filter((t) => t.label === project.id).length}
                  onSelect={() => setSelectedProject(project)}
                  onEdit={() => {
                    setEditingProject(project);
                    setProjectName(project.name);
                    setProjectEmoji(project.emoji);
                    setProjectColor(project.color);
                    setFormOpen(true);
                  }}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      <Modal open={formOpen} onOpenChange={setFormOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {editingProject ? "Редактировать проект" : "Новый проект"}
            </ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Название
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Название проекта"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Эмодзи
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setProjectEmoji(emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                      projectEmoji === emoji
                        ? "bg-[var(--accent)]/20 ring-2 ring-[var(--accent)]"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Цвет
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectColor(color)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      projectColor === color
                        ? "ring-2 ring-offset-2 ring-[var(--foreground)]"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--secondary)] mb-2">Предпросмотр</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{projectEmoji}</span>
                <span className="font-medium">
                  {projectName.trim() || "Название проекта"}
                </span>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: projectColor }}
                />
              </div>
            </div>
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Отмена</Button>
            </ModalClose>
            <Button
              onClick={editingProject ? handleUpdateProject : handleCreateProject}
              disabled={!projectName.trim()}
            >
              {editingProject ? "Сохранить" : "Создать"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <TaskForm
        open={taskFormOpen}
        onClose={() => {
          setTaskFormOpen(false);
          setEditingTask(undefined);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
      />
      <TaskDetail
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <>
      <div className="hidden md:block">
        <ProjectsPageDesktop />
      </div>
      <div className="md:hidden">
        <ProjectsPageMobile />
      </div>
    </>
  );
}
