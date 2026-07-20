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

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  initialData?: Task;
}

export function TaskForm({ open, onClose, onSubmit, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || "medium");
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.split("T")[0] || "");
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setTagsInput("");
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
            <textarea
              placeholder="Описание (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
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
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <Input
              placeholder="Теги через запятую"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">{initialData ? "Сохранить" : "Создать"}</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
