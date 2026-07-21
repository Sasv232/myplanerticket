"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Task } from "@/types/task";
import { Header } from "@/components/layout/header";
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
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "month" | "week" | "day";

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => i + 6);

const priorityVariant: Record<
  string,
  "destructive" | "warning" | "default" | "secondary"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
};

export function CalendarPageDesktop() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(
      data.map(
        (t: Task & { tags: string; repeat_rule: string | null }) => ({
          ...t,
          tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
          repeatRule: t.repeat_rule || t.repeatRule || null,
        })
      )
    );
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));

  const getTasksForHour = (day: Date, hour: number) =>
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return isSameDay(due, day) && due.getHours() === hour;
    });

  const navButton = (dir: "left" | "right") => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (viewMode === "month") {
          setCurrentMonth(dir === "left" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
        } else if (viewMode === "week") {
          setCurrentDate(dir === "left" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        } else {
          setCurrentDate(dir === "left" ? subDays(currentDate, 1) : addDays(currentDate, 1));
        }
      }}
    >
      {dir === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  );

  const viewLabel =
    viewMode === "month"
      ? format(currentMonth, "LLLL yyyy", { locale: ru })
      : viewMode === "week"
        ? `${format(weekDays[0], "d MMM", { locale: ru })} — ${format(weekDays[6], "d MMM", { locale: ru })}`
        : format(currentDate, "d MMMM yyyy", { locale: ru });

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
      {(["month", "week", "day"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === mode
              ? "bg-[var(--background)] text-foreground shadow-sm"
              : "text-[var(--secondary)] hover:text-foreground"
          }`}
        >
          {mode === "month" ? "Месяц" : mode === "week" ? "Неделя" : "День"}
        </button>
      ))}
    </div>
  );

  const actions = (
    <div className="flex items-center gap-3">
      {viewToggle}
      {navButton("left")}
      <span className="min-w-[160px] text-center text-sm font-medium">{viewLabel}</span>
      {navButton("right")}
    </div>
  );

  const weekDayHeaders = weekDays.map((d) => (
    <div
      key={d.toISOString()}
      className={`flex flex-col items-center min-h-[50px] border-b border-[var(--border)] p-2 ${
        isToday(d) ? "bg-[var(--accent)]/5" : ""
      }`}
    >
      <span className="text-xs text-[var(--secondary)]">{format(d, "EEE", { locale: ru })}</span>
      <span className={`text-lg font-semibold ${isToday(d) ? "text-[var(--accent)]" : ""}`}>
        {format(d, "d")}
      </span>
    </div>
  ));

  return (
    <>
      <Header title="Календарь" description="Задачи по датам" actions={actions} />
      <main className="p-6">
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-px rounded-xl border border-[var(--border)] bg-[var(--border)] overflow-hidden">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <div
                key={day}
                className="min-h-[100px] p-2 text-center text-xs font-medium text-[var(--secondary)]"
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayTasks = getTasksForDay(day);
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] bg-[var(--card)] p-2 ${
                    today ? "ring-2 ring-[var(--accent)] ring-inset" : ""
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-medium ${
                      today ? "text-[var(--accent)]" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="truncate rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px]"
                        title={task.title}
                      >
                        <Badge
                          variant={priorityVariant[task.priority]}
                          className="mr-1 text-[8px] px-1"
                        >
                          {task.priority.charAt(0).toUpperCase()}
                        </Badge>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-[var(--secondary)]">
                        +{dayTasks.length - 3}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "week" && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="grid grid-cols-8 border-b border-[var(--border)]">
              <div className="border-r border-[var(--border)]" />
              {weekDayHeaders}
            </div>
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
              {TIME_SLOTS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-[var(--border)] last:border-b-0">
                  <div className="border-r border-[var(--border)] p-2 text-xs text-[var(--secondary)] text-right">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day) => {
                    const slotTasks = getTasksForHour(day, hour);
                    const today = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[48px] p-1 ${today ? "bg-[var(--accent)]/5" : ""}`}
                      >
                        {slotTasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] mb-1 truncate"
                            title={task.title}
                          >
                            <Badge
                              variant={priorityVariant[task.priority]}
                              className="mr-1 text-[8px] px-1"
                            >
                              {task.priority.charAt(0).toUpperCase()}
                            </Badge>
                            {task.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "day" && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className={`border-b border-[var(--border)] p-4 ${isToday(currentDate) ? "bg-[var(--accent)]/5" : ""}`}>
              <div className="text-center">
                <span className="text-xs text-[var(--secondary)]">
                  {format(currentDate, "EEEE", { locale: ru })}
                </span>
                <span className={`block text-2xl font-bold ${isToday(currentDate) ? "text-[var(--accent)]" : ""}`}>
                  {format(currentDate, "d", { locale: ru })}
                </span>
              </div>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {TIME_SLOTS.map((hour) => {
                const hourTasks = getTasksForHour(currentDate, hour);
                return (
                  <div key={hour} className="grid grid-cols-[60px_1fr] border-b border-[var(--border)] last:border-b-0 min-h-[56px]">
                    <div className="border-r border-[var(--border)] p-2 text-xs text-[var(--secondary)] text-right pt-4">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    <div className="p-2 space-y-1">
                      {hourTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded bg-[var(--accent)]/10 px-2 py-1 text-xs"
                        >
                          <Badge
                            variant={priorityVariant[task.priority]}
                            className="mr-1 text-[10px] px-1"
                          >
                            {task.priority.charAt(0).toUpperCase()}
                          </Badge>
                          {task.title}
                          {task.description && (
                            <span className="ml-2 text-[var(--secondary)]">
                              {task.description.length > 40
                                ? task.description.slice(0, 40) + "…"
                                : task.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
