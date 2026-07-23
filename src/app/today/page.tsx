"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Task, TaskStatus } from "@/types/task";
import { Header } from "@/components/layout/header";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/tasks/task-card";
import { parseTaskInput } from "@/lib/nlp";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  AlertTriangle,
  Inbox,
  ListChecks,
  GripVertical,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { format, isToday, parseISO, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

const priorityVariant: Record<
  string,
  "destructive" | "warning" | "default" | "secondary"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
};

function normalizeTask(
  t: Task & { tags?: string; repeat_rule?: string | null }
): Task {
  return {
    ...t,
    tags: typeof t.tags === "string" ? JSON.parse(t.tags) : (t.tags ?? []),
    repeatRule: t.repeat_rule || t.repeatRule || null,
  };
}

function DesktopSkeleton() {
  return (
    <div className="hidden md:block p-6">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-48 rounded-lg bg-[var(--surface)] animate-pulse" />
        <div className="h-4 w-72 rounded bg-[var(--surface)] animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-lg bg-[var(--surface)] animate-pulse mb-6" />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
        <div className="col-span-5">
          <div className="h-64 rounded-xl bg-[var(--surface)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="md:hidden p-4">
      <div className="h-6 w-32 rounded bg-[var(--surface)] animate-pulse mb-4" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--surface)] animate-pulse" />
        ))}
      </div>
      <div className="h-10 w-full rounded-lg bg-[var(--surface)] animate-pulse mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-lg bg-[var(--surface)] animate-pulse mb-2" />
      ))}
    </div>
  );
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [plannerOrder, setPlannerOrder] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const { setOpen } = useMobileSidebar();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.map(normalizeTask));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "done" &&
          t.dueDate &&
          isToday(parseISO(t.dueDate))
      ),
    [tasks]
  );

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "done" &&
          t.dueDate &&
          isBefore(parseISO(t.dueDate), today)
      ),
    [tasks, today]
  );

  const noDateTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done" && !t.dueDate),
    [tasks]
  );

  const plannerTasks = useMemo(() => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const ids = plannerOrder.filter((id) => {
      const t = taskMap.get(id);
      return (
        t && t.status !== "done" && t.dueDate && isToday(parseISO(t.dueDate))
      );
    });
    const seen = new Set(ids);
    todayTasks.forEach((t) => {
      if (!seen.has(t.id)) ids.push(t.id);
    });
    return ids.map((id) => taskMap.get(id)!).filter(Boolean);
  }, [plannerOrder, todayTasks, tasks]);

  const stats = useMemo(
    () => ({
      today: todayTasks.length,
      overdue: overdueTasks.length,
      noDate: noDateTasks.length,
    }),
    [todayTasks, overdueTasks, noDateTasks]
  );

  const handleQuickAdd = async () => {
    if (!quickInput.trim() || adding) return;
    const parsed = parseTaskInput(quickInput);
    if (!parsed.title) return;

    setAdding(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsed.title,
          dueDate: parsed.dueDate ?? todayStr,
          priority: parsed.priority ?? "medium",
          label: parsed.label ?? undefined,
          repeatRule: parsed.repeatRule ?? undefined,
        }),
      });
      setQuickInput("");
      await fetchTasks();
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(status === "done" ? { completedAt: new Date().toISOString() } : {}),
      }),
    });
    fetchTasks();
  };

  const handleEdit = (task: Task) => {};

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.setData("plannerIdx", String(idx));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const srcIdx = dragIdx;
    setDragIdx(null);
    if (srcIdx === null || srcIdx === targetIdx) return;
    const ids = plannerTasks.map((t) => t.id);
    const [moved] = ids.splice(srcIdx, 1);
    ids.splice(targetIdx, 0, moved);
    setPlannerOrder(ids);
  };

  const handleDragOverItem = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const isEmpty =
    !loading &&
    todayTasks.length === 0 &&
    overdueTasks.length === 0 &&
    noDateTasks.length === 0;

  if (loading) {
    return (
      <>
        <DesktopSkeleton />
        <MobileSkeleton />
      </>
    );
  }

  return (
    <>
      {/* ═══════════════════════ DESKTOP ═══════════════════════ */}
      <div className="hidden md:block">
        <Header
          title="Сегодня"
          description={format(today, "d MMMM yyyy, EEEE", { locale: ru })}
          actions={
            <div className="flex items-center gap-3 text-sm text-[var(--secondary)]">
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                {stats.today} задач на сегодня
              </span>
              {stats.overdue > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--error)]">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.overdue} просрочено
                </span>
              )}
              {stats.noDate > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Inbox className="h-4 w-4" />
                  {stats.noDate} без даты
                </span>
              )}
            </div>
          }
        />
        <main className="p-6">
          {/* Quick-add */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Input
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                placeholder='Добавить задачу… (напр. «Завтра срочно @работа», «Каждый понедельник отчёт»)'
                className="flex-1"
                disabled={adding}
              />
              <Button onClick={handleQuickAdd} size="icon" disabled={adding}>
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* ── Left: task sections ── */}
            <div className="col-span-7 space-y-6">
              {/* Today */}
              {todayTasks.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    Сегодня
                    <span className="text-[var(--muted)] font-normal ml-1">
                      {todayTasks.length}
                    </span>
                  </h2>
                  <AnimatePresence initial={false}>
                    {todayTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2"
                      >
                        <TaskCard
                          task={task}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </section>
              )}

              {/* Overdue */}
              {overdueTasks.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--error)]">
                    <AlertTriangle className="h-4 w-4" />
                    Просрочено
                    <span className="text-[var(--muted)] font-normal ml-1">
                      {overdueTasks.length}
                    </span>
                  </h2>
                  <AnimatePresence initial={false}>
                    {overdueTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2"
                      >
                        <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5">
                          <TaskCard
                            task={task}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </section>
              )}

              {/* No date */}
              {noDateTasks.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                    <Inbox className="h-4 w-4" />
                    Без даты
                    <span className="text-[var(--muted)] font-normal ml-1">
                      {noDateTasks.length}
                    </span>
                  </h2>
                  <AnimatePresence initial={false}>
                    {noDateTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2"
                      >
                        <TaskCard
                          task={task}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </section>
              )}

              {isEmpty && (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
                  <Inbox className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" />
                  <p className="text-sm font-medium text-[var(--secondary)]">
                    Нет задач на сегодня
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Добавьте задачу через поле выше или в Planner
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: planner ── */}
            <div className="col-span-5">
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <ListChecks className="h-4 w-4" />
                    Планировщик дня
                  </h2>
                  <p className="mb-4 text-xs text-[var(--muted)]">
                    Перетаскивайте задачи, чтобы расставить приоритеты на день
                  </p>
                  {plannerTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--muted)]">
                      Нет задач на сегодня
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {plannerTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragOver={handleDragOverItem}
                          className={`flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2.5 text-sm transition-all ${
                            dragIdx === idx
                              ? "opacity-50 border-[var(--accent)]"
                              : "hover:border-[var(--accent)]/30"
                          } cursor-grab active:cursor-grabbing`}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                          <button
                            onClick={() =>
                              handleStatusChange(
                                task.id,
                                task.status === "done" ? "todo" : "done"
                              )
                            }
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                              task.status === "done"
                                ? "bg-[var(--success)] border-[var(--success)] text-white"
                                : "border-[var(--border)]"
                            }`}
                          >
                            {task.status === "done" && (
                              <Check className="h-3 w-3" />
                            )}
                          </button>
                          <span
                            className={`flex-1 truncate ${
                              task.status === "done"
                                ? "line-through opacity-60"
                                : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          <Badge
                            variant={priorityVariant[task.priority]}
                            className="text-[9px] shrink-0"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* ═══════════════════════ MOBILE ═══════════════════════ */}
      <div className="md:hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="h-10 w-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center active:scale-95 transition-all duration-150">
                <span className="text-sm font-bold text-[var(--accent)]">M</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Сегодня</h1>
                <p className="text-sm text-[var(--secondary)]">
                  {format(today, "d MMMM, EEEE", { locale: ru })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5 pb-24">
          {/* Stats row - 3 cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="mobile-section p-4 text-center">
              <div className="text-2xl font-bold text-[var(--accent)]">
                {stats.today}
              </div>
              <div className="text-[11px] text-[var(--muted)] uppercase tracking-wide mt-1 font-medium">
                Сегодня
              </div>
            </div>
            <div className="mobile-section p-4 text-center">
              <div className="text-2xl font-bold text-[var(--error)]">
                {stats.overdue}
              </div>
              <div className="text-[11px] text-[var(--muted)] uppercase tracking-wide mt-1 font-medium">
                Просрочено
              </div>
            </div>
            <div className="mobile-section p-4 text-center">
              <div className="text-2xl font-bold text-[var(--secondary)]">
                {stats.noDate}
              </div>
              <div className="text-[11px] text-[var(--muted)] uppercase tracking-wide mt-1 font-medium">
                Без даты
              </div>
            </div>
          </div>

          {/* Quick-add */}
          <div className="relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
            <Input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="Добавить задачу…"
              className="mobile-input pl-12"
              disabled={adding}
            />
            {adding && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-[var(--muted)]" />
            )}
          </div>

          {/* Today */}
          {todayTasks.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--accent)] px-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                Сегодня
                <span className="text-[var(--muted)] font-normal">
                  {todayTasks.length}
                </span>
              </h2>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {todayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <MobileTaskRow
                        task={task}
                        onStatusChange={handleStatusChange}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--error)] px-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--error)]" />
                Просрочено
                <span className="text-[var(--muted)] font-normal">
                  {overdueTasks.length}
                </span>
              </h2>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {overdueTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="rounded-2xl bg-[var(--error)]/5 ring-1 ring-[var(--error)]/15">
                        <MobileTaskRow
                          task={task}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* No date */}
          {noDateTasks.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--muted)] px-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]" />
                Без даты
                <span className="text-[var(--muted)] font-normal">
                  {noDateTasks.length}
                </span>
              </h2>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {noDateTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <MobileTaskRow
                        task={task}
                        onStatusChange={handleStatusChange}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {isEmpty && (
            <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-12 text-center">
              <Inbox className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" />
              <p className="text-base font-medium text-[var(--secondary)]">
                Нет задач на сегодня
              </p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Нажмите + чтобы добавить первую
              </p>
            </div>
          )}

          {/* Mobile Planner */}
          <MobilePlanner
            plannerTasks={plannerTasks}
            dragIdx={dragIdx}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOverItem}
            onToggleDragIdx={setDragIdx}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* FAB */}
        <button
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>(
              'input[placeholder="Добавить задачу…"]'
            );
            input?.focus();
            input?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}

/* ────────────── Mobile Task Row ────────────── */
function MobileTaskRow({
  task,
  onStatusChange,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const isDone = task.status === "done";
  const priorityVariant: Record<string, string> = {
    urgent: "destructive",
    high: "warning",
    medium: "default",
    low: "secondary",
  };

  return (
    <div className="mobile-section p-4 flex items-center gap-4">
      <button
        onClick={() =>
          onStatusChange(
            task.id,
            isDone ? "todo" : "done"
          )
        }
        className={`mobile-checkbox ${isDone ? "mobile-checkbox-checked" : ""}`}
      >
        {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[15px] font-medium truncate ${
              isDone ? "line-through opacity-60" : ""
            }`}
          >
            {task.title}
          </span>
        </div>
      </div>
      <Badge
        variant={priorityVariant[task.priority] as any}
        className="text-[10px] px-2.5 py-0.5 shrink-0"
      >
        {task.priority}
      </Badge>
    </div>
  );
}

/* ────────────── Mobile Planner ────────────── */
function MobilePlanner({
  plannerTasks,
  dragIdx,
  onDragStart,
  onDrop,
  onDragOver,
  onToggleDragIdx,
  onStatusChange,
}: {
  plannerTasks: Task[];
  dragIdx: number | null;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDrop: (e: React.DragEvent, targetIdx: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onToggleDragIdx: (v: number | null) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  if (plannerTasks.length === 0) return null;

  return (
    <div className="mobile-section">
      <div className="p-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between text-base font-semibold"
        >
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Планировщик дня
          </span>
          {open ? (
            <ChevronUp className="h-5 w-5 text-[var(--secondary)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--secondary)]" />
          )}
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {plannerTasks.map((task, idx) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDrop={(e) => onDrop(e, idx)}
              onDragOver={onDragOver}
              className={`flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3 text-sm transition-all ${
                dragIdx === idx
                  ? "opacity-50 ring-1 ring-[var(--accent)]"
                  : ""
              } cursor-grab active:cursor-grabbing`}
            >
              <GripVertical className="h-4 w-4 text-[var(--muted)] shrink-0" />
              <button
                onClick={() =>
                  onStatusChange(
                    task.id,
                    task.status === "done" ? "todo" : "done"
                  )
                }
                className={`mobile-checkbox !h-6 !w-6 !rounded-lg ${task.status === "done" ? "mobile-checkbox-checked" : ""}`}
              >
                {task.status === "done" && (
                  <span className="text-[8px]">✓</span>
                )}
              </button>
              <span
                className={`flex-1 truncate text-sm ${
                  task.status === "done" ? "line-through opacity-60" : ""
                }`}
              >
                {task.title}
              </span>
              <Badge
                variant={
                  priorityVariant[task.priority] as
                    | "destructive"
                    | "warning"
                    | "default"
                    | "secondary"
                }
                className="text-[9px] shrink-0"
              >
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
