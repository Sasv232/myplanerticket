"use client";

import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Repeat, Check } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Markdown from "react-markdown";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; variant: "destructive" | "warning" | "default" | "secondary" }> = {
  urgent: { label: "Срочно", variant: "destructive" },
  high: { label: "Высокий", variant: "warning" },
  medium: { label: "Средний", variant: "default" },
  low: { label: "Низкий", variant: "secondary" },
};

const repeatLabels: Record<string, string> = {
  daily: "Каждый день",
  weekly: "Каждую неделю",
  biweekly: "Каждые 2 недели",
  monthly: "Каждый месяц",
  yearly: "Каждый год",
  weekdays: "По будням",
  weekends: "По выходным",
};

const LABEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  work: { label: "Работа", color: "#3b82f6", bg: "#3b82f620" },
  personal: { label: "Личное", color: "#22c55e", bg: "#22c55e20" },
  urgent: { label: "Срочно", color: "#ef4444", bg: "#ef444420" },
  study: { label: "Учёба", color: "#8b5cf6", bg: "#8b5cf620" },
  health: { label: "Здоровье", color: "#f97316", bg: "#f9731620" },
  finance: { label: "Финансы", color: "#06b6d4", bg: "#06b6d420" },
  home: { label: "Дом", color: "#ec4899", bg: "#ec489920" },
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange, onClick, selected, onSelect, showCheckbox }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const labelCfg = task.label ? LABEL_CONFIG[task.label] : null;

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === "done") {
      onStatusChange(task.id, "todo");
    } else {
      onStatusChange(task.id, "done");
    }
  };

  return (
    <Card
      className={`group p-4 hover:border-[var(--accent)]/30 mobile-task-card ${labelCfg ? `border-l-4` : ""}`}
      style={labelCfg ? { borderLeftColor: labelCfg.color } : undefined}
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-start gap-3">
        {showCheckbox ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onSelect?.(task.id); }}
            className="mt-1 h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
          />
        ) : (
          <button
            onClick={handleQuickComplete}
            className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${
              task.status === "done"
                ? "bg-[var(--success)] border-[var(--success)] text-white"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            {task.status === "done" && <Check className="h-3.5 w-3.5" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`font-medium truncate ${task.status === "done" ? "line-through opacity-60" : ""}`}>
              {task.title}
            </h3>
            <Badge variant={priority.variant} className="text-[10px]">{priority.label}</Badge>
          </div>
          {labelCfg && (
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mb-1"
              style={{ color: labelCfg.color, backgroundColor: labelCfg.bg }}
            >
              {labelCfg.label}
            </span>
          )}
          {task.repeatRule && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--secondary)] mb-1">
              <Repeat className="h-3 w-3" />
              {repeatLabels[task.repeatRule] || task.repeatRule}
            </div>
          )}
          {task.description && (
            <div className="prose prose-xs dark:prose-invert max-w-none text-sm text-[var(--secondary)] line-clamp-2 mb-2">
              <Markdown>{task.description}</Markdown>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-[var(--secondary)]">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "d MMM", { locale: ru })}
              </span>
            )}
            {task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-[var(--surface)] px-1.5 py-0.5 text-[10px]">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--error)]" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
