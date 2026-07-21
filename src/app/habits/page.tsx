"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import {
  Check,
  Plus,
  Flame,
  Calendar,
  Trash2,
} from "lucide-react";

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
}

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  frequency: "daily" | "weekly" | "monthly";
  logs: HabitLog[];
}

const EMOJIS = [
  "🏋️", "📚", "💧", "🧘", "🏃", "✍️", "🎯", "💊",
  "🌅", "😴", "🧹", "🎵", "💻", "🥗", "🧑‍💻", "🐕",
  "📝", "🎨", "🧹", "💰", "🌍", "📱", "⏰", "🍎",
  "🚴", "🧠", "💪", "🫀", "🥗", "🛌", "🧹", "📖",
];

const COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626",
  "#7c3aed", "#ec4899", "#06b6d4", "#84cc16",
];

const FREQ_LABELS: Record<string, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDayKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function calcStreak(logs: HabitLog[], frequency: string): number {
  const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
  if (dates.length === 0) return 0;
  const today = getDayKey(new Date());
  if (dates[0] !== today) {
    const yesterday = getDayKey(new Date(Date.now() - 86400000));
    if (dates[0] !== yesterday) return 0;
  }
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const cur = new Date(dates[i]);
    const diff = (prev.getTime() - cur.getTime()) / 86400000;
    if (frequency === "daily" && diff === 1) {
      streak++;
    } else if (frequency === "weekly" && diff <= 7) {
      streak++;
    } else if (frequency === "monthly" && diff <= 31) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function HabitCalendarGrid({ habit }: { habit: Habit }) {
  const today = new Date();
  const logDates = new Set(habit.logs.map((l) => l.date));
  const days: { date: string; completed: boolean; inRange: boolean }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getDayKey(d);
    const dDate = new Date(key);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 29);
    days.push({
      date: key,
      completed: logDates.has(key),
      inRange: dDate >= rangeStart && dDate <= today,
    });
  }

  return (
    <div className="flex gap-0.5 flex-wrap">
      {days.map((day) => (
        <div
          key={day.date}
          title={`${day.date}${day.completed ? " ✓" : ""}`}
          className="w-2.5 h-2.5 rounded-sm transition-colors"
          style={{
            backgroundColor: day.completed
              ? habit.color
              : "var(--surface)",
            opacity: day.inRange ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

function AddHabitModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (data: {
    name: string;
    emoji: string;
    color: string;
    frequency: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState("daily");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), emoji, color, frequency });
    setName("");
    setEmoji("🎯");
    setColor(COLORS[0]);
    setFrequency("daily");
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Новая привычка</ModalTitle>
          <ModalDescription>Добавьте привычку для отслеживания</ModalDescription>
        </ModalHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Название</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Зарядка"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Эмодзи</label>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${
                    emoji === e
                      ? "bg-[var(--accent)]/15 ring-2 ring-[var(--accent)] scale-110"
                      : "hover:bg-[var(--surface)]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Цвет</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-[var(--foreground)] scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Частота</label>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((f) => (
                <Button
                  key={f}
                  variant={frequency === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFrequency(f)}
                >
                  {FREQ_LABELS[f]}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>Добавить</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function HabitCardDesktop({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const today = getToday();
  const doneToday = habit.logs.some((l) => l.date === today);
  const streak = calcStreak(habit.logs, habit.frequency);
  const totalDone = new Set(habit.logs.map((l) => l.date)).size;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{habit.emoji}</span>
            <div>
              <CardTitle className="text-base">{habit.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{FREQ_LABELS[habit.frequency]}</Badge>
                <span className="text-xs text-[var(--secondary)]">{totalDone} дней</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <Badge variant="warning" className="gap-1">
                <Flame className="h-3 w-3" />
                {streak}
              </Badge>
            )}
            <Button
              variant={doneToday ? "default" : "outline"}
              size="icon"
              className="h-9 w-9"
              onClick={() => onToggle(habit.id)}
              style={
                doneToday
                  ? { backgroundColor: habit.color, borderColor: habit.color }
                  : undefined
              }
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[var(--secondary)] hover:text-[var(--error)]"
              onClick={() => onDelete(habit.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <HabitCalendarGrid habit={habit} />
      </CardContent>
    </Card>
  );
}

function HabitCardMobile({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const today = getToday();
  const doneToday = habit.logs.some((l) => l.date === today);
  const streak = calcStreak(habit.logs, habit.frequency);

  return (
    <Card className="mobile-widget-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{habit.emoji}</span>
            <div>
              <p className="font-medium text-sm">{habit.name}</p>
              <p className="text-xs text-[var(--secondary)]">
                {FREQ_LABELS[habit.frequency]}
                {streak > 0 && (
                  <span className="ml-2 text-[var(--warning)]">
                    🔥 {streak}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle(habit.id)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                backgroundColor: doneToday
                  ? habit.color
                  : "var(--surface)",
                color: doneToday ? "#fff" : "var(--secondary)",
              }}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(habit.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--secondary)] hover:text-[var(--error)] active:scale-90"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <HabitCalendarGrid habit={habit} />
      </CardContent>
    </Card>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      setHabits(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const today = getToday();
  const doneToday = habits.filter((h) =>
    h.logs.some((l) => l.date === today)
  ).length;

  const handleToggle = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const doneToday = habit.logs.some((l) => l.date === today);

    if (doneToday) {
      const log = habit.logs.find((l) => l.date === today);
      if (log) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? { ...h, logs: h.logs.filter((l) => l.id !== log.id) }
              : h
          )
        );
        await fetch(`/api/habits/${habitId}/log`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today }),
        }).catch(() => fetchHabits());
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, logs: [...h.logs, { id: tempId, habitId, date: today }] }
            : h
        )
      );
      await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      }).catch(() => fetchHabits());
    }
  };

  const handleAdd = async (data: {
    name: string;
    emoji: string;
    color: string;
    frequency: string;
  }) => {
    const tempId = `temp-${Date.now()}`;
    setHabits((prev) => [
      ...prev,
      { id: tempId, name: data.name, emoji: data.emoji, color: data.color, frequency: data.frequency as Habit["frequency"], logs: [] },
    ]);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(() => fetchHabits()).catch(() => fetchHabits());
  };

  const handleDelete = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    await fetch(`/api/habits/${habitId}`, {
      method: "DELETE",
    }).catch(() => fetchHabits());
  };

  const desktopContent = (
    <>
      <Header
        title="Привычки"
        description={`Выполнено сегодня: ${doneToday}/${habits.length} привычек`}
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        }
      />
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--secondary)]">
            Загрузка...
          </div>
        ) : habits.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <Calendar className="h-12 w-12 text-[var(--secondary)]" />
              <div>
                <p className="text-lg font-medium">Нет привычек</p>
                <p className="text-sm text-[var(--secondary)] mt-1">
                  Добавьте первую привычку для отслеживания
                </p>
              </div>
              <Button onClick={() => setAddOpen(true)} className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                Добавить привычку
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {habits.map((habit) => (
              <HabitCardDesktop
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );

  const mobileContent = (
    <div className="mobile-main">
      <div className="mobile-content space-y-4">
        <div className="mobile-page-header">
          <h1 className="text-2xl font-bold tracking-tight">Привычки</h1>
          <p className="text-sm text-[var(--secondary)]">
            Выполнено сегодня: {doneToday}/{habits.length}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--secondary)]">
            Загрузка...
          </div>
        ) : habits.length === 0 ? (
          <Card className="mobile-widget-card">
            <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
              <Calendar className="h-10 w-10 text-[var(--secondary)]" />
              <div>
                <p className="font-medium">Нет привычек</p>
                <p className="text-sm text-[var(--secondary)]">
                  Добавьте первую привычку
                </p>
              </div>
              <Button
                onClick={() => setAddOpen(true)}
                className="gap-2 mt-1"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCardMobile
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <button
          className="mobile-fab"
          onClick={() => setAddOpen(true)}
          aria-label="Добавить привычку"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{desktopContent}</div>
      <div className="md:hidden">{mobileContent}</div>
      <AddHabitModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />
    </>
  );
}
