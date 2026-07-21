"use client";

import { useCallback, useState, useEffect } from "react";
import { TaskStatus, TaskPriority } from "@/types/task";
import { Search, X } from "lucide-react";
import { VoiceButton } from "@/components/ui/voice-button";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | "all";
  onStatusChange: (value: TaskStatus | "all") => void;
  priority: TaskPriority | "all";
  onPriorityChange: (value: TaskPriority | "all") => void;
  label?: string;
  onLabelChange?: (value: string) => void;
  projectId?: string;
  onProjectChange?: (value: string) => void;
}

interface Project {
  id: string;
  name: string;
  emoji: string;
}

export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  label = "",
  onLabelChange,
  projectId = "",
  onProjectChange,
}: TaskFiltersProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((tasks) => {
        const allLabels = new Set<string>();
        tasks.forEach((t: { label?: string | null }) => {
          if (t.label) allLabels.add(t.label);
        });
        setLabels(Array.from(allLabels).sort());
      })
      .catch(() => {});
  }, []);

  const handleVoiceSearch = useCallback((text: string) => {
    onSearchChange(text);
  }, [onSearchChange]);

  const hasFilters = status !== "all" || priority !== "all" || label || projectId;

  const clearFilters = () => {
    onStatusChange("all");
    onPriorityChange("all");
    onLabelChange?.("");
    onProjectChange?.("");
    onSearchChange("");
  };

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
      <div className="flex gap-2 flex-wrap">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | "all")}
          className="h-10 flex-1 min-w-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="all">Все статусы</option>
          <option value="todo">К выполнению</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполнено</option>
        </select>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "all")}
          className="h-10 flex-1 min-w-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="all">Все приоритеты</option>
          <option value="urgent">Срочный</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
        {onLabelChange && labels.length > 0 && (
          <select
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            className="h-10 flex-1 min-w-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Все метки</option>
            {labels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        )}
        {onProjectChange && projects.length > 0 && (
          <select
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="h-10 flex-1 min-w-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Все проекты</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--secondary)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
