"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
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
import { Check, Plus, Flame, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
}

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  logs: HabitLog[];
}

const EMOJIS = [
  "🏋️","📚","💧","🧘","🏃","✍️","🎯","💊",
  "🌅","😴","🧹","🎵","💻","🥗","🐕","📝",
  "🎨","💰","🌍","📱","⏰","🍎","🚴","🧠",
  "💪","🫀","🛌","📖","🎶","💤","🧹","🪴",
];

const COLORS = [
  "#2563eb","#16a34a","#d97706","#dc2626",
  "#7c3aed","#ec4899","#06b6d4","#84cc16",
];

const FREQ: Record<string, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
};

function today() {
  return new Date().toISOString().split("T")[0];
}

function dayKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function streak(logs: HabitLog[], freq: string): number {
  const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
  if (!dates.length) return 0;
  const t = today();
  if (dates[0] !== t) {
    const y = dayKey(new Date(Date.now() - 86400000));
    if (dates[0] !== y) return 0;
  }
  let s = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
    if (freq === "daily" && diff === 1) s++;
    else if (freq === "weekly" && diff <= 7) s++;
    else if (freq === "monthly" && diff <= 31) s++;
    else break;
  }
  return s;
}

function MiniGrid({ habit }: { habit: Habit }) {
  const now = new Date();
  const logDates = new Set(habit.logs.map((l) => l.date));
  const days: { date: string; done: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    days.push({ date: key, done: logDates.has(key) });
  }
  return (
    <div className="flex gap-[3px] flex-wrap">
      {days.map((day) => (
        <div
          key={day.date}
          title={day.date}
          className="w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: day.done ? habit.color : "var(--surface)" }}
        />
      ))}
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const doneToday = habit.logs.some((l) => l.date === today());
  const s = streak(habit.logs, habit.frequency);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{habit.emoji}</span>
          <div>
            <p className="font-semibold text-[15px]">{habit.name}</p>
            <Badge variant="secondary" className="text-[10px] mt-0.5">{FREQ[habit.frequency]}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {s > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
              <Flame className="h-3.5 w-3.5" /> {s}
            </span>
          )}
          <button
            onClick={() => onDelete(habit.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--muted)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <MiniGrid habit={habit} />
      <button
        onClick={() => onToggle(habit.id)}
        className={`mt-3 w-full h-10 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
          doneToday
            ? "text-white"
            : "border-2 border-dashed text-[var(--secondary)] hover:border-solid"
        }`}
        style={doneToday ? { backgroundColor: habit.color } : { borderColor: habit.color + "60" }}
      >
        <Check className="h-4 w-4" />
        {doneToday ? "Выполнено" : "Отметить"}
      </button>
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
  const doneToday = habit.logs.some((l) => l.date === today());
  const s = streak(habit.logs, habit.frequency);

  return (
    <div className="mobile-task-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{habit.emoji}</span>
          <span className="font-semibold text-[15px]">{habit.name}</span>
          <Badge variant="secondary" className="text-[9px]">{FREQ[habit.frequency]}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {s > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
              <Flame className="h-3 w-3" /> {s}
            </span>
          )}
          <button onClick={() => onDelete(habit.id)} className="p-1 text-[var(--muted)]">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <MiniGrid habit={habit} />
      <button
        onClick={() => onToggle(habit.id)}
        className={`mt-2.5 w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          doneToday ? "text-white" : "border-2 border-dashed"
        }`}
        style={{
          backgroundColor: doneToday ? habit.color : "transparent",
          borderColor: doneToday ? habit.color : habit.color + "50",
          color: doneToday ? "#fff" : habit.color,
        }}
      >
        <Check className="h-4 w-4" />
        {doneToday ? "Выполнено today" : "Отметить"}
      </button>
    </div>
  );
}

function AddModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (d: { name: string; emoji: string; color: string; frequency: string }) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState(COLORS[0]);
  const [freq, setFreq] = useState("daily");
  const [nameError, setNameError] = useState(false);

  const submit = () => {
    if (!name.trim()) { setNameError(true); return; }
    onAdd({ name: name.trim(), emoji, color, frequency: freq });
    setName(""); setEmoji("🎯"); setColor(COLORS[0]); setFreq("daily");
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Новая привычка</ModalTitle>
          <ModalDescription>Создайте полезную привычку</ModalDescription>
        </ModalHeader>
        <div className="grid gap-4 py-2">
          <div>
            <label className="form-label">Название</label>
            <Input
              placeholder="Например: Медитация"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false); }}
              autoFocus
              className={nameError ? "!border-[var(--error)]" : ""}
            />
            {nameError && <p className="mt-1.5 text-sm text-[var(--error)]">Обязательно заполните название</p>}
          </div>
          <div>
            <label className="form-label">Эмодзи</label>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`text-xl w-9 h-9 flex items-center justify-center rounded-lg transition-all ${emoji === e ? "bg-[var(--accent)]/15 ring-2 ring-[var(--accent)]" : "hover:bg-[var(--surface)]"}`}
                >{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Цвет</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-[var(--foreground)] scale-110" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Частота</label>
            <div className="flex gap-2">
              {Object.entries(FREQ).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setFreq(k)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${freq === k ? "text-white" : "border border-[var(--border)] hover:bg-[var(--surface)]"}`}
                  style={freq === k ? { backgroundColor: color } : undefined}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={submit}>Создать</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      if (Array.isArray(data)) setHabits(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const toggleLog = useCallback(async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const doneToday = habit.logs.some((l) => l.date === today());

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        if (doneToday) {
          return { ...h, logs: h.logs.filter((l) => l.date !== today()) };
        }
        return { ...h, logs: [...h.logs, { id: "temp", habitId, date: today(), count: 1 }] };
      })
    );

    try {
      if (doneToday) {
        await fetch(`/api/habits/${habitId}/logs?date=${today()}`, { method: "DELETE" });
      } else {
        await fetch(`/api/habits/${habitId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today() }) });
      }
    } catch { fetchHabits(); }
  }, [habits, fetchHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    try { await fetch(`/api/habits/${id}`, { method: "DELETE" }); } catch { fetchHabits(); }
  }, [fetchHabits]);

  const addHabit = useCallback(async (data: { name: string; emoji: string; color: string; frequency: string }) => {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newHabit = await res.json();
      setHabits((prev) => [...prev, { ...newHabit, logs: [] }]);
    } catch { fetchHabits(); }
  }, [fetchHabits]);

  const doneToday = habits.filter((h) => h.logs.some((l) => l.date === today())).length;

  const desktopContent = (
    <>
      <Header
        title="Привычки"
        description={`${doneToday}/${habits.length} выполнено сегодня`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Добавить</Button>}
      />
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--secondary)]">Загрузка...</div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-lg font-semibold mb-1">Нет привычек</p>
            <p className="text-sm text-[var(--secondary)] mb-4">Создайте первую полезную привычку</p>
            <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Создать</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {habits.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                  <HabitCard habit={h} onToggle={toggleLog} onDelete={deleteHabit} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </>
  );

  const mobileContent = (
    <div className="mobile-main">
      <div className="mobile-page-header">
        <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">Привычки</p>
            <p className="text-[11px] text-[var(--secondary)]">{doneToday}/{habits.length} сегодня</p>
          </div>
          <button onClick={() => setAddOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mobile-content">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--secondary)] text-sm">Загрузка...</div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-semibold mb-1">Нет привычек</p>
            <p className="text-sm text-[var(--secondary)]">Нажмите + чтобы создать</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {habits.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ delay: i * 0.04 }}>
                  <HabitCardMobile habit={h} onToggle={toggleLog} onDelete={deleteHabit} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <button onClick={() => setAddOpen(true)} className="mobile-fab">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{desktopContent}</div>
      <div className="md:hidden">{mobileContent}</div>
      <AddModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addHabit} />
    </>
  );
}
