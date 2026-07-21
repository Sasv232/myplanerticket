"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, CreateTaskInput, TaskStatus, TaskPriority } from "@/types/task";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
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
  Users,
  UserPlus,
} from "lucide-react";
import { CollabPanel, JoinProjectModal } from "@/components/projects/collab-panel";

interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  taskCount?: number;
  createdAt: string;
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
  "📁", "🎯", "💼", "🚀", "⭐", "📊", "🔧", "🎨",
  "📝", "🏠", "💡", "🎮", "📚", "🎵", "🌟", "🔥",
  "💻", "📱",
];

function useProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectEmoji, setProjectEmoji] = useState("📁");
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);
  const [collabOpen, setCollabOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

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
    } else {
      fetchTasks();
    }
  }, [selectedProject, fetchTasks]);

  const taskCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    if (task.label) {
      taskCounts[task.label] = (taskCounts[task.label] || 0) + 1;
    }
  });

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName.trim(), emoji: projectEmoji, color: projectColor }),
    });
    setFormOpen(false);
    resetForm();
    fetchProjects();
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !projectName.trim()) return;
    await fetch(`/api/projects/${editingProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName.trim(), emoji: projectEmoji, color: projectColor }),
    });
    setFormOpen(false);
    setEditingProject(undefined);
    resetForm();
    fetchProjects();
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject((prev) =>
        prev ? { ...prev, name: projectName.trim(), emoji: projectEmoji, color: projectColor } : null
      );
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Удалить проект? Задачи не будут удалены.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (selectedProject?.id === id) setSelectedProject(null);
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

  const resetForm = () => {
    setProjectName("");
    setProjectEmoji("📁");
    setProjectColor(PROJECT_COLORS[0]);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectEmoji(project.emoji);
    setProjectColor(project.color);
    setFormOpen(true);
  };

  const openCreateModal = () => {
    setEditingProject(undefined);
    resetForm();
    setFormOpen(true);
  };

  return {
    projects, tasks, loading, selectedProject, setSelectedProject,
    formOpen, setFormOpen, editingProject,
    taskFormOpen, setTaskFormOpen, editingTask, setEditingTask,
    detailTask, setDetailTask,
    projectName, setProjectName, projectEmoji, setProjectEmoji,
    projectColor, setProjectColor,
    taskCounts,
    handleCreateProject, handleUpdateProject, handleDeleteProject,
    handleCreateTask, handleUpdateTask, handleDeleteTask, handleStatusChange,
    openEditModal, openCreateModal,
    collabOpen, setCollabOpen, joinOpen, setJoinOpen,
  };
}

const PROJECT_LIST_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const PROJECT_CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function ProjectCardDesktop({
  project,
  taskCount,
  onSelect,
  onEdit,
  onDelete,
}: {
  project: Project;
  taskCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div variants={PROJECT_CARD_VARIANTS}>
      <Card
        hover
        className="relative overflow-hidden cursor-pointer"
        onClick={onSelect}
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">{project.emoji}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--foreground)] truncate">{project.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  {taskCount} {taskCount === 1 ? "задача" : taskCount < 5 ? "задачи" : "задач"}
                </Badge>
              </div>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="rounded-lg p-1.5 text-[var(--secondary)] hover:bg-[var(--surface)] transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] overflow-hidden"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Редактировать
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--surface)] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Удалить
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectCardMobile({
  project,
  taskCount,
  onSelect,
  onLongPress,
}: {
  project: Project;
  taskCount: number;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    const timer = setTimeout(() => onLongPress(), 500);
    setPressTimer(timer);
  };

  const handlePointerUp = () => {
    if (pressTimer) clearTimeout(pressTimer);
    setPressTimer(null);
  };

  return (
    <motion.div
      variants={PROJECT_CARD_VARIANTS}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="relative overflow-hidden active:bg-[var(--surface-hover)] transition-colors"
        onClick={onSelect}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="h-1 w-full" style={{ backgroundColor: project.color }} />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0">{project.emoji}</span>
            <span className="font-semibold text-[var(--foreground)] truncate flex-1 min-w-0">
              {project.name}
            </span>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {taskCount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectFormModal({
  open,
  onOpenChange,
  editingProject,
  projectName,
  onNameChange,
  projectEmoji,
  onEmojiChange,
  projectColor,
  onColorChange,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject: Project | undefined;
  projectName: string;
  onNameChange: (v: string) => void;
  projectEmoji: string;
  onEmojiChange: (v: string) => void;
  projectColor: string;
  onColorChange: (v: string) => void;
  onCreate: () => void;
  onUpdate: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{editingProject ? "Редактировать проект" : "Новый проект"}</ModalTitle>
        </ModalHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Название</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Название проекта"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Эмодзи</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onEmojiChange(emoji)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all ${
                    projectEmoji === emoji
                      ? "bg-[var(--accent)]/20 ring-2 ring-[var(--accent)] scale-110"
                      : "bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Цвет</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    projectColor === color
                      ? "ring-2 ring-offset-2 ring-[var(--foreground)] scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs text-[var(--secondary)] mb-2">Предпросмотр</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{projectEmoji}</span>
              <span className="font-medium">{projectName.trim() || "Название проекта"}</span>
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: projectColor }} />
            </div>
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Отмена</Button>
          </ModalClose>
          <Button
            onClick={editingProject ? onUpdate : onCreate}
            disabled={!projectName.trim()}
          >
            {editingProject ? "Сохранить" : "Создать"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function ProjectsPage() {
  const store = useProjectsPage();

  return (
    <>
      <div className="hidden md:block">
        <ProjectsPageDesktop {...store} />
      </div>
      <div className="md:hidden">
        <ProjectsPageMobile {...store} />
      </div>
    </>
  );
}

function ProjectsPageDesktop(props: ReturnType<typeof useProjectsPage>) {
  const {
    projects, tasks, loading, selectedProject, setSelectedProject,
    formOpen, setFormOpen, editingProject,
    taskFormOpen, setTaskFormOpen, editingTask, setEditingTask,
    detailTask, setDetailTask,
    projectName, setProjectName, projectEmoji, setProjectEmoji,
    projectColor, setProjectColor,
    taskCounts,
    handleCreateProject, handleUpdateProject, handleDeleteProject,
    handleCreateTask, handleUpdateTask, handleDeleteTask, handleStatusChange,
    openEditModal, openCreateModal,
    collabOpen, setCollabOpen, joinOpen, setJoinOpen,
  } = props;

  const filteredTasks = tasks
    .filter((t) => !selectedProject || t.label === selectedProject.id)
    .sort((a, b) => {
      const order: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

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
        title={selectedProject ? `${selectedProject.emoji} ${selectedProject.name}` : "Проекты"}
        description={
          selectedProject
            ? `${filteredTasks.length} ${filteredTasks.length === 1 ? "задача" : filteredTasks.length < 5 ? "задачи" : "задач"}`
            : `Всего проектов: ${projects.length}`
        }
        actions={
          selectedProject ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCollabOpen(true)}>
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setSelectedProject(null)}>
                <ArrowLeft className="h-4 w-4" />
                Все проекты
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Вступить
              </Button>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Новый проект
              </Button>
            </div>
          )
        }
      />

      <main className="p-6">
        {selectedProject ? (
          <>
            <div className="mb-4 flex items-center gap-3 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-bold">{selectedProject.name}</h2>
              <Button size="sm" className="ml-auto" onClick={() => setTaskFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Задача
              </Button>
            </div>

            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                    <ListTodo className="mb-3 h-10 w-10 opacity-50" />
                    <p>Задач в проекте пока нет</p>
                    <Button variant="ghost" className="mt-2" onClick={() => setTaskFormOpen(true)}>
                      Создать первую задачу
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      layout
                    >
                      <TaskCard
                        task={task}
                        onEdit={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        onClick={(t) => setDetailTask(t)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        ) : (
          <>
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-[var(--secondary)]">
                  <FolderKanban className="mb-3 h-12 w-12 opacity-40" />
                  <p className="text-lg font-medium">Проектов пока нет</p>
                  <Button variant="ghost" className="mt-2" onClick={openCreateModal}>
                    Создать первый проект
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={PROJECT_LIST_VARIANTS}
                initial="hidden"
                animate="visible"
              >
                {projects.map((project) => (
                  <ProjectCardDesktop
                    key={project.id}
                    project={project}
                    taskCount={taskCounts[project.id] || 0}
                    onSelect={() => setSelectedProject(project)}
                    onEdit={() => openEditModal(project)}
                    onDelete={() => handleDeleteProject(project.id)}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>

      <ProjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editingProject={editingProject}
        projectName={projectName}
        onNameChange={setProjectName}
        projectEmoji={projectEmoji}
        onEmojiChange={setProjectEmoji}
        projectColor={projectColor}
        onColorChange={setProjectColor}
        onCreate={handleCreateProject}
        onUpdate={handleUpdateProject}
      />
      <TaskForm
        open={taskFormOpen}
        onClose={() => { setTaskFormOpen(false); setEditingTask(undefined); }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
      />
      <TaskDetail task={detailTask} open={!!detailTask} onClose={() => setDetailTask(null)} />
      {selectedProject && collabOpen && (
        <CollabPanel projectId={selectedProject.id} isOwner={true} onClose={() => setCollabOpen(false)} />
      )}
      <JoinProjectModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}

function ProjectsPageMobile(props: ReturnType<typeof useProjectsPage>) {
  const {
    projects, tasks, loading, selectedProject, setSelectedProject,
    formOpen, setFormOpen, editingProject,
    taskFormOpen, setTaskFormOpen, editingTask, setEditingTask,
    detailTask, setDetailTask,
    projectName, setProjectName, projectEmoji, setProjectEmoji,
    projectColor, setProjectColor,
    taskCounts,
    handleCreateProject, handleUpdateProject, handleDeleteProject,
    handleCreateTask, handleUpdateTask, handleDeleteTask, handleStatusChange,
    openEditModal, openCreateModal,
    collabOpen, setCollabOpen, joinOpen, setJoinOpen,
  } = props;

  const filteredTasks = tasks
    .filter((t) => !selectedProject || t.label === selectedProject.id)
    .sort((a, b) => {
      const order: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-[var(--secondary)]">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-3">
          {selectedProject ? (
            <>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--surface)] transition-colors shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="text-lg font-bold truncate">
                  {selectedProject.emoji} {selectedProject.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCollabOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] shrink-0">
                  <Users className="h-5 w-5" />
                </button>
                <button onClick={() => setTaskFormOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white shrink-0">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight">Проекты</h1>
              <div className="flex gap-2">
                <button onClick={() => setJoinOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)]">
                  <UserPlus className="h-5 w-5" />
                </button>
                <button onClick={openCreateModal} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {selectedProject ? (
          <>
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                  <ListTodo className="mb-3 h-10 w-10 opacity-50" />
                  <p className="text-center">Задач в проекте пока нет</p>
                  <Button variant="ghost" className="mt-2" onClick={() => setTaskFormOpen(true)}>
                    Создать первую задачу
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      layout
                    >
                      <TaskCard
                        task={task}
                        onEdit={(t) => { setEditingTask(t); setTaskFormOpen(true); }}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        onClick={(t) => setDetailTask(t)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          <>
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                  <FolderKanban className="mb-3 h-10 w-10 opacity-50" />
                  <p className="text-center">Проектов пока нет</p>
                  <Button variant="ghost" className="mt-2" onClick={openCreateModal}>
                    Создать первый проект
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="space-y-3"
                variants={PROJECT_LIST_VARIANTS}
                initial="hidden"
                animate="visible"
              >
                {projects.map((project) => (
                  <ProjectCardMobile
                    key={project.id}
                    project={project}
                    taskCount={taskCounts[project.id] || 0}
                    onSelect={() => setSelectedProject(project)}
                    onLongPress={() => openEditModal(project)}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {!selectedProject && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
          onClick={openCreateModal}
          className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[var(--shadow-lg)] active:scale-95 transition-transform"
          style={{ boxShadow: "0 8px 32px var(--accent)" }}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      <ProjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editingProject={editingProject}
        projectName={projectName}
        onNameChange={setProjectName}
        projectEmoji={projectEmoji}
        onEmojiChange={setProjectEmoji}
        projectColor={projectColor}
        onColorChange={setProjectColor}
        onCreate={handleCreateProject}
        onUpdate={handleUpdateProject}
      />
      <TaskForm
        open={taskFormOpen}
        onClose={() => { setTaskFormOpen(false); setEditingTask(undefined); }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
      />
      <TaskDetail task={detailTask} open={!!detailTask} onClose={() => setDetailTask(null)} />
      {selectedProject && collabOpen && (
        <CollabPanel projectId={selectedProject.id} isOwner={true} onClose={() => setCollabOpen(false)} />
      )}
      <JoinProjectModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
