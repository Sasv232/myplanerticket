"use client";

import { useState } from "react";
import { Task, CreateTaskInput, TaskPriority } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Repeat, Palette } from "lucide-react";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  initialData?: Task;
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

export function TaskForm({ open, onClose, onSubmit, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.split("T")[0] || "");
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") || "");
  const [repeatRule, setRepeatRule] = useState(initialData?.repeatRule || "");
  const [label, setLabel] = useState(initialData?.label || "");

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
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setTagsInput("");
    setRepeatRule("");
    setLabel("");
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
            <Input
              placeholder="Название задачи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Описание (Markdown)</label>
              <textarea
                placeholder="**Жирный**, *курсив*, - список"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Дедлайн</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <Repeat className="h-3.5 w-3.5" /> Повторение
                </label>
                <select
                  value={repeatRule}
                  onChange={(e) => setRepeatRule(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {REPEAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <Palette className="h-3.5 w-3.5" /> Лейбл
                </label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {LABEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              placeholder="Теги через запятую"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
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
