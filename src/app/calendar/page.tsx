"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const priorityVariant: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
  urgent: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(
      data.map((t: Task & { tags: string; repeat_rule: string | null }) => ({
        ...t,
        tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
        repeatRule: t.repeat_rule || t.repeatRule || null,
      }))
    );
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));

  return (
    <div className="space-y-4">
      <div className="mobile-page-header">
        <h1 className="text-2xl font-bold tracking-tight">Календарь</h1>
      </div>

      <div className="mobile-widget-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold">
            {format(currentMonth, "LLLL yyyy", { locale: ru })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-[var(--secondary)]">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[60px] rounded-xl p-1.5 transition-colors ${
                  today ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]" : "bg-[var(--surface)]"
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${today ? "text-[var(--accent)]" : ""}`}>
                  {format(day, "d")}
                </p>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="truncate rounded-lg bg-[var(--card)] px-1 py-0.5 text-[8px]"
                      title={task.title}
                    >
                      <Badge variant={priorityVariant[task.priority]} className="mr-0.5 text-[6px] px-0.5">
                        {task.priority.charAt(0).toUpperCase()}
                      </Badge>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <p className="text-[8px] text-[var(--secondary)]">+{dayTasks.length - 2}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
