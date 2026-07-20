"use client";

import { TaskStatus, TaskPriority } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | "all";
  onStatusChange: (value: TaskStatus | "all") => void;
  priority: TaskPriority | "all";
  onPriorityChange: (value: TaskPriority | "all") => void;
}

export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--secondary)]" />
        <Input
          placeholder="Поиск задач..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatus | "all")}
        className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <option value="all">Все статусы</option>
        <option value="todo">К выполнению</option>
        <option value="in_progress">В работе</option>
        <option value="done">Выполнено</option>
      </select>
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "all")}
        className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <option value="all">Все приоритеты</option>
        <option value="urgent">Срочный</option>
        <option value="high">Высокий</option>
        <option value="medium">Средний</option>
        <option value="low">Низкий</option>
      </select>
    </div>
  );
}
