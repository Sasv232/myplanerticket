"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Task, TaskStatus } from "@/types/task";
import { Header } from "@/components/layout/header";
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

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quickInput, setQuickInput] = useState("");
  const [plannerOrder, setPlannerOrder] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.map(normalizeTask));
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
      return t && t.status !== "done" && t.dueDate && isToday(parseISO(t.dueDate));
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
    if (!quickInput.trim()) return;
    const parsed = parseTaskInput(quickInput);
    if (!parsed.title) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsed.title,
        dueDate: parsed.dueDate ?? undefined,
        priority: parsed.priority ?? "medium",
        label: parsed.label ?? undefined,
        repeatRule: parsed.repeatRule ?? undefined,
      }),
    });
    setQuickInput("");
    fetchTasks();
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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

  return (
    <>
      {/* ─── Desktop ─── */}
      <div className="hidden md:block">
        <Header
          title="Сегодня"
          description={`${format(today, "d MMMM yyyy", { locale: ru })}`}
          actions={
            <div className="flex items-center gap-3 text-sm text-[var(--secondary)]">
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                {stats.today} задач
              </span>
              {stats.overdue > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--error)]">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.overdue} просрочено
                </span>
              )}
              {stats.noDate > 0 && (
                <span className="flex items-center gap-1.5">
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
                placeholder="Добавить задачу… (напр. «Завтра в 10:00 срочно @работа»)"
                className="flex-1"
              />
              <Button onClick={handleQuickAdd} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* ── Left: task sections ── */}
            <div className="col-span-7 space-y-6">
              {/* Today */}
              {todayTasks.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--secondary)]">
                    <Calendar className="h-4 w-4" />
                    На сегодня
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

              {/* No date */}
              {noDateTasks.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--secondary)]">
                    <Inbox className="h-4 w-4" />
                    Без даты
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

              {todayTasks.length === 0 &&
                overdueTasks.length === 0 &&
                noDateTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
                    <Inbox className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" />
                    <p className="text-sm text-[var(--secondary)]">
                      Нет задач. Добавьте первую!
                    </p>
                  </div>
                )}
            </div>

            {/* ── Right: planner ── */}
            <div className="col-span-5">
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <ListChecks className="h-4 w-4" />
                    Планировщик дня
                  </h2>
                  <p className="mb-4 text-xs text-[var(--secondary)]">
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
                          <GripVertical className="h-3.5 w-3.5 text-[var(--muted)] flex-shrink-0" />
                          <button
                            onClick={() =>
                              handleStatusChange(
                                task.id,
                                task.status === "done" ? "todo" : "done"
                              )
                            }
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                              task.status === "done"
                                ? "bg-[var(--success)] border-[var(--success)] text-white"
                                : "border-[var(--border)]"
                            }`}
                          >
                            {task.status === "done" && (
                              <span className="text-[10px]">✓</span>
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
                            className="text-[9px] flex-shrink-0"
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

      {/* ─── Mobile ─── */}
      <div className="md:hidden">
        <MobileHeader title="Сегодня" />
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-[var(--secondary)]">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {stats.today} задач
            </span>
            {stats.overdue > 0 && (
              <span className="flex items-center gap-1 text-[var(--error)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                {stats.overdue}
              </span>
            )}
            {stats.noDate > 0 && (
              <span className="flex items-center gap-1">
                <Inbox className="h-3.5 w-3.5" />
                {stats.noDate}
              </span>
            )}
          </div>

          {/* Quick-add */}
          <div className="flex gap-2">
            <Input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder="Добавить задачу…"
              className="flex-1 h-9 text-sm"
            />
            <Button onClick={handleQuickAdd} size="icon" className="h-9 w-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Today */}
          {todayTasks.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary)]">
                <Calendar className="h-3.5 w-3.5" />
                На сегодня
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
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--error)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Просрочено
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

          {/* No date */}
          {noDateTasks.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary)]">
                <Inbox className="h-3.5 w-3.5" />
                Без даты
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

          {/* Planner (mobile: collapsible) */}
          <PlannerMobile
            plannerTasks={plannerTasks}
            dragIdx={dragIdx}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOverItem}
            onToggleDragIdx={setDragIdx}
            onStatusChange={handleStatusChange}
          />

          {todayTasks.length === 0 &&
            overdueTasks.length === 0 &&
            noDateTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
                <Inbox className="mx-auto mb-2 h-6 w-6 text-[var(--muted)]" />
                <p className="text-xs text-[var(--secondary)]">
                  Нет задач. Добавьте первую!
                </p>
              </div>
            )}
        </div>
      </div>
    </>
  );
}

function PlannerMobile({
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

  return (
    <Card>
      <CardContent className="p-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          <span className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Планировщик дня
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-[var(--secondary)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--secondary)]" />
          )}
        </button>
        {open && (
          <div className="mt-3 space-y-1.5">
            {plannerTasks.length === 0 ? (
              <p className="text-xs text-[var(--muted)] text-center py-4">
                Нет задач на сегодня
              </p>
            ) : (
              plannerTasks.map((task, idx) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDrop={(e) => onDrop(e, idx)}
                  onDragOver={onDragOver}
                  className={`flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-sm transition-all ${
                    dragIdx === idx
                      ? "opacity-50 border-[var(--accent)]"
                      : ""
                  } cursor-grab active:cursor-grabbing`}
                >
                  <GripVertical className="h-3 w-3 text-[var(--muted)] flex-shrink-0" />
                  <button
                    onClick={() =>
                      onStatusChange(
                        task.id,
                        task.status === "done" ? "todo" : "done"
                      )
                    }
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                      task.status === "done"
                        ? "bg-[var(--success)] border-[var(--success)] text-white"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {task.status === "done" && (
                      <span className="text-[8px]">✓</span>
                    )}
                  </button>
                  <span
                    className={`flex-1 truncate text-xs ${
                      task.status === "done" ? "line-through opacity-60" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  <Badge
                    variant={priorityVariant[task.priority]}
                    className="text-[9px] flex-shrink-0"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
