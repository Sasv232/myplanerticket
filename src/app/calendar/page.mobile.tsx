"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Task } from "@/types/task";
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

type ViewMode = "month" | "week" | "day";

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => i + 6);

const priorityVariant: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
  urgent: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
};

export function CalendarPageMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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

  const nav = (dir: "left" | "right") => {
    if (viewMode === "month") {
      setCurrentMonth(dir === "left" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
    } else if (viewMode === "week") {
      setCurrentDate(dir === "left" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === "left" ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const viewLabel =
    viewMode === "month"
      ? format(currentMonth, "LLLL yyyy", { locale: ru })
      : viewMode === "week"
        ? `${format(weekDays[0], "d MMM", { locale: ru })} — ${format(weekDays[6], "d MMM", { locale: ru })}`
        : format(currentDate, "d MMMM yyyy", { locale: ru });

  return (
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Календарь</h1>
      </div>

      <div className="p-5 space-y-5">
        {/* View toggle + Navigation */}
        <div className="mobile-section p-4 space-y-4">
          {/* View pills */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] p-1">
              {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`mobile-pill text-xs ${viewMode === mode ? "mobile-pill-active" : "mobile-pill-inactive"}`}
                >
                  {mode === "month" ? "Месяц" : mode === "week" ? "Неделя" : "День"}
                </button>
              ))}
            </div>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => nav("left")} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-base font-semibold">{viewLabel}</span>
            <button onClick={() => nav("right")} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Month grid */}
          {viewMode === "month" && (
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
                    className={`min-h-[64px] rounded-xl p-2 transition-all ${
                      today
                        ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30"
                        : "bg-[var(--surface)]"
                    }`}
                  >
                    <p className={`mb-1 text-xs font-semibold ${today ? "text-[var(--accent)]" : ""}`}>
                      {format(day, "d")}
                    </p>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="truncate rounded-md bg-[var(--card)] px-1.5 py-0.5 text-[9px] shadow-xs"
                          title={task.title}
                        >
                          <Badge variant={priorityVariant[task.priority]} className="mr-1 text-[7px] px-1">
                            {task.priority.charAt(0).toUpperCase()}
                          </Badge>
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[9px] text-[var(--secondary)]">+{dayTasks.length - 2}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week view */}
          {viewMode === "week" && (
            <div className="rounded-2xl overflow-hidden">
              <div className="grid grid-cols-8">
                <div />
                {weekDays.map((d) => (
                  <div
                    key={d.toISOString()}
                    className={`flex flex-col items-center py-2 ${isToday(d) ? "bg-[var(--accent)]/10" : ""}`}
                  >
                    <span className="text-[10px] text-[var(--secondary)]">{format(d, "EEE", { locale: ru })}</span>
                    <span className={`text-sm font-semibold ${isToday(d) ? "text-[var(--accent)]" : ""}`}>
                      {format(d, "d")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {TIME_SLOTS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-t border-[var(--border)]">
                    <div className="p-1 text-[10px] text-[var(--secondary)] text-right pr-2 pt-2">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day) => {
                      const slotTasks = getTasksForHour(day, hour);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`min-h-[36px] p-0.5 ${isToday(day) ? "bg-[var(--accent)]/5" : ""}`}
                        >
                          {slotTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-md bg-[var(--accent)]/10 px-1 py-0.5 text-[9px] mb-0.5 truncate"
                            >
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

          {/* Day view */}
          {viewMode === "day" && (
            <div className="rounded-2xl overflow-hidden">
              <div className={`p-4 ${isToday(currentDate) ? "bg-[var(--accent)]/10" : ""}`}>
                <div className="text-center">
                  <span className="text-xs text-[var(--secondary)]">
                    {format(currentDate, "EEEE", { locale: ru })}
                  </span>
                  <span className={`block text-2xl font-bold ${isToday(currentDate) ? "text-[var(--accent)]" : ""}`}>
                    {format(currentDate, "d", { locale: ru })}
                  </span>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {TIME_SLOTS.map((hour) => {
                  const hourTasks = getTasksForHour(currentDate, hour);
                  return (
                    <div key={hour} className="grid grid-cols-[48px_1fr] border-t border-[var(--border)] min-h-[48px]">
                      <div className="p-1 text-[10px] text-[var(--secondary)] text-right pt-3 pr-2">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      <div className="p-1.5 space-y-1">
                        {hourTasks.map((task) => (
                          <div key={task.id} className="rounded-lg bg-[var(--accent)]/10 px-2 py-1 text-xs">
                            <Badge variant={priorityVariant[task.priority]} className="mr-1 text-[9px] px-1">
                              {task.priority.charAt(0).toUpperCase()}
                            </Badge>
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
