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
import { Repeat, Palette, Sparkles } from "lucide-react";
import { parseTaskInput } from "@/lib/nlp";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  initialData?: Task;
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

export function TaskForm({ open, onClose, onSubmit, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.split("T")[0] || "");
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") || "");
  const [repeatRule, setRepeatRule] = useState(initialData?.repeatRule || "");
  const [label, setLabel] = useState(initialData?.label || "");
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [emoji, setEmoji] = useState(initialData?.emoji || "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(() => {});
  }, []);

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
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      repeatRule: repeatRule || undefined,
      label: label || undefined,
      projectId: projectId || undefined,
      emoji: emoji || undefined,
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setTagsInput("");
    setRepeatRule("");
    setLabel("");
    setProjectId("");
    setEmoji("");
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
            {/* Title + Emoji */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Название задачи (или попробуйте: 'завтра в 10:00 позвонить маме !high')"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (title && !initialData && title.length > 5) {
                      handleNlpInput(title);
                    }
                  }}
                  autoFocus
                  className="pr-12"
                />
                <VoiceButton
                  onResult={handleVoiceTitle}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xl hover:bg-[var(--surface-hover)] transition-all duration-150"
                >
                  {emoji || "😊"}
                </button>
                {showEmojiPicker && (
                  <div className="absolute right-0 top-12 z-50 p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] grid grid-cols-4 gap-2 animate-scale-in">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                        className="text-xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] transition-all duration-150"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* NLP hint */}
            {!initialData && (
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                <Sparkles className="h-3 w-3" />
                Напишите дату, время, приоритет или повторение прямо в названии
              </div>
            )}

            {/* Description */}
            <div>
              <label className="form-label">Описание (Markdown)</label>
              <div className="relative">
                <textarea
                  placeholder="**Жирный**, *курсив*, - список"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input min-h-[100px] font-mono text-[13px] resize-none"
                />
                <VoiceButton
                  onResult={handleVoiceDescription}
                  size="sm"
                  className="absolute right-2 top-2"
                />
              </div>
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="form-input"
                >
                  <option value="low">🟢 Низкий</option>
                  <option value="medium">🔵 Средний</option>
                  <option value="high">🟠 Высокий</option>
                  <option value="urgent">🔴 Срочный</option>
                </select>
              </div>
              <div>
                <label className="form-label">Дедлайн</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input" />
              </div>
            </div>

            {/* Repeat + Label */}
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

            {/* Project */}
            {projects.length > 0 && (
              <div>
                <label className="form-label">Проект</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Без проекта</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.emoji || "📁"} {p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags */}
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
