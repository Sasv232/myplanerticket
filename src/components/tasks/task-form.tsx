"use client";

import { useState, useCallback, useEffect } from "react";
import { Task, CreateTaskInput, TaskPriority } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceButton } from "@/components/ui/voice-button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Repeat, Palette, Sparkles, User } from "lucide-react";
import { parseTaskInput } from "@/lib/nlp";

interface ProjectMember {
  userId: string;
  userName: string;
  role: string;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  initialData?: Task;
  defaultProjectId?: string;
}

interface Project {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

const REPEAT_OPTIONS = [
  { value: "", label: "Не повторять" },
  { value: "daily", label: "Каждый день" },
  { value: "weekly", label: "Каждую неделю" },
  { value: "biweekly", label: "Каждые 2 недели" },
  { value: "monthly", label: "Каждый месяц" },
  { value: "yearly", label: "Каждый год" },
  { value: "weekdays", label: "По будням" },
  { value: "weekends", label: "По выходным" },
];

const LABEL_OPTIONS = [
  { value: "", label: "Без лейбла", color: "" },
  { value: "work", label: "Работа", color: "#3b82f6" },
  { value: "personal", label: "Личное", color: "#22c55e" },
  { value: "urgent", label: "Срочно", color: "#ef4444" },
  { value: "study", label: "Учёба", color: "#8b5cf6" },
  { value: "health", label: "Здоровье", color: "#f97316" },
  { value: "finance", label: "Финансы", color: "#06b6d4" },
  { value: "home", label: "Дом", color: "#ec4899" },
];

const EMOJI_OPTIONS = ["📝", "💼", "🏠", "🏋️", "📚", "💰", "🎯", "🛒", "✈️", "🎨", "💻", "🎵", "🍕", "🎂", "🔔", "⭐"];

export function TaskForm({ open, onClose, onSubmit, initialData, defaultProjectId }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.split("T")[0] || "");
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(", ") || "");
  const [repeatRule, setRepeatRule] = useState(initialData?.repeatRule || "");
  const [repeatAfterComplete, setRepeatAfterComplete] = useState(initialData?.repeatAfterComplete ?? false);
  const [label, setLabel] = useState(initialData?.label || "");
  const [projectId, setProjectId] = useState(initialData?.projectId || defaultProjectId || "");
  const [emoji, setEmoji] = useState(initialData?.emoji || "");
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}/members`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setProjectMembers(data);
        })
        .catch(() => {});
    } else {
      setProjectMembers([]);
    }
  }, [projectId]);

  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  const handleNlpInput = useCallback((text: string) => {
    const parsed = parseTaskInput(text);
    setTitle(parsed.title);
    if (parsed.dueDate) setDueDate(parsed.dueDate);
    if (parsed.priority) setPriority(parsed.priority as TaskPriority);
    if (parsed.label) setLabel(parsed.label);
    if (parsed.repeatRule) setRepeatRule(parsed.repeatRule);
  }, []);

  const handleVoiceTitle = useCallback((text: string) => {
    setTitle((prev) => {
      const newText = prev ? prev + " " + text : text;
      return newText;
    });
  }, []);

  const handleVoiceDescription = useCallback((text: string) => {
    setDescription((prev) => {
      const newText = prev ? prev + " " + text : text;
      return newText;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      repeatRule: repeatRule || undefined,
      repeatAfterComplete: repeatAfterComplete,
      label: label || undefined,
      projectId: projectId || undefined,
      emoji: emoji || undefined,
      assigneeId: assigneeId || undefined,
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setTagsInput("");
    setRepeatRule("");
    setRepeatAfterComplete(false);
    setLabel("");
    setProjectId(defaultProjectId || "");
    setEmoji("");
    setAssigneeId("");
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>{initialData ? "Редактировать задачу" : "Новая задача"}</ModalTitle>
            <ModalDescription>
              {initialData ? "Измените данные задачи" : "Создайте новую задачу"}
            </ModalDescription>
          </ModalHeader>
          <div className="grid gap-4 py-4">
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Название задачи (или попробуйте: 'завтра в 10:00 позвонить маме !high')"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
                    onBlur={() => {
                      if (title && !initialData && title.length > 5) {
                        handleNlpInput(title);
                      }
                    }}
                    autoFocus
                    className={`pr-12 ${titleError ? "!border-[var(--error)] !ring-[var(--error)]/20" : ""}`}
                  />
                  <VoiceButton
                    onResult={handleVoiceTitle}
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>
              {titleError && (
                <p className="mt-2 text-sm text-[var(--error)] font-medium animate-slide-down">
                  Обязательно заполните название задачи
                </p>
              )}
            </div>

            {!initialData && (
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                <Sparkles className="h-3 w-3" />
                Напишите дату, время, приоритет или повторение прямо в названии
              </div>
            )}

            <div>
              <label className="form-label">Описание</label>
              <div className="relative">
                <textarea
                  placeholder="Описание задачи"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input min-h-[100px] text-[13px] resize-none"
                />
                <VoiceButton
                  onResult={handleVoiceDescription}
                  size="sm"
                  className="absolute right-2 top-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="form-input"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
              <div>
                <label className="form-label">Дедлайн</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Repeat className="h-3 w-3" /> Повторение
                </label>
                <select
                  value={repeatRule}
                  onChange={(e) => setRepeatRule(e.target.value)}
                  className="form-input"
                >
                  {REPEAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {repeatRule && (
                  <label className="flex items-center gap-2 mt-2 text-[12px] text-[var(--secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={repeatAfterComplete}
                      onChange={(e) => setRepeatAfterComplete(e.target.checked)}
                      className="h-3.5 w-3.5 rounded accent-[var(--accent)]"
                    />
                    Автоматически создавать следующую
                  </label>
                )}
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Palette className="h-3 w-3" /> Лейбл
                </label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="form-input"
                >
                  {LABEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {projects.length > 0 && (
              <div>
                <label className="form-label">Проект</label>
                <select
                  value={projectId}
                  onChange={(e) => { setProjectId(e.target.value); setAssigneeId(""); }}
                  className="form-input"
                >
                  <option value="">Без проекта</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {projectId && projectMembers.length > 0 && (
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Ответственный
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Не назначен</option>
                  {projectMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.userName}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Теги</label>
              <Input
                placeholder="Теги через запятую"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit">{initialData ? "Сохранить" : "Создать"}</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
