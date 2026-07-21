"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import { Header } from "@/components/layout/header";
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

export function CalendarPageDesktop() {
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
    <div>
      <Header
        title="╨Ъ╨░╨╗╨╡╨╜╨┤╨░╤А╤М"
        description="╨Ч╨░╨┤╨░╤З╨╕ ╨┐╨╛ ╨┤╨░╤В╨░╨╝"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-medium">
              {format(currentMonth, "LLLL yyyy", { locale: ru })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-7 gap-px rounded-xl border border-[var(--border)] bg-[var(--border)] overflow-hidden">
        {["╨Я╨╜", "╨Т╤В", "╨б╤А", "╨з╤В", "╨Я╤В", "╨б╨▒", "╨Т╤Б"].map((day) => (
          <div key={day} className="bg-[var(--surface)] p-2 text-center text-xs font-medium text-[var(--secondary)]">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] bg-[var(--card)] p-2 ${today ? "ring-2 ring-[var(--accent)] ring-inset" : ""}`}
            >
              <p className={`mb-1 text-xs font-medium ${today ? "text-[var(--accent)]" : ""}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="truncate rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px]"
                    title={task.title}
                  >
                    <Badge variant={priorityVariant[task.priority]} className="mr-1 text-[8px] px-1">
                      {task.priority.charAt(0).toUpperCase()}
                    </Badge>
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-[var(--secondary)]">+{dayTasks.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
