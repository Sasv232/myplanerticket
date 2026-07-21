"use client";

import { useCallback } from "react";
import { TaskStatus, TaskPriority } from "@/types/task";
import { Search } from "lucide-react";
import { VoiceButton } from "@/components/ui/voice-button";

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
  const handleVoiceSearch = useCallback((text: string) => {
    onSearchChange(text);
  }, [onSearchChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--secondary)]" />
        <input
          data-search
          placeholder="Поиск задач..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
        />
        <VoiceButton
          onResult={handleVoiceSearch}
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | "all")}
          className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="all">Все статусы</option>
          <option value="todo">К выполнению</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполнено</option>
        </select>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "all")}
          className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="all">Все приоритеты</option>
          <option value="urgent">Срочный</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </div>
    </div>
  );
}
