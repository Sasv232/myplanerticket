"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { format, subDays, startOfWeek, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Smile, Plus, Trash2, TrendingUp, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MOODS = [
  { value: "great", emoji: "😄", label: "Отлично", color: "#22c55e" },
  { value: "good", emoji: "🙂", label: "Хорошо", color: "#84cc16" },
  { value: "ok", emoji: "😐", label: "Нормально", color: "#eab308" },
  { value: "bad", emoji: "😔", label: "Плохо", color: "#f97316" },
  { value: "terrible", emoji: "😢", label: "Ужасно", color: "#ef4444" },
];

interface MoodEntry {
  id: string;
  mood: string;
  note: string | null;
  date: string;
  createdAt: string;
}

export function MoodPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { setOpen } = useMobileSidebar();

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/mood?limit=30&t=" + Date.now());
      const data = await res.json();
      if (Array.isArray(data)) setEntries(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAdd = async () => {
    if (!selectedMood) return;
    const today = new Date().toISOString().split("T")[0];
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: selectedMood, note: note.trim() || null, date: today }),
    });
    setSelectedMood(null);
    setNote("");
    setShowForm(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/mood?id=${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getMoodConfig = (mood: string) => MOODS.find((m) => m.value === mood) || MOODS[2];

  const weekMoodValues = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayEntry = entries.find((e) => e.date === dateStr);
    return dayEntry ? MOODS.findIndex((m) => m.value === dayEntry.mood) : -1;
  });
  const avgMood = weekMoodValues.filter((v) => v >= 0);
  const moodAverage = avgMood.length > 0 ? avgMood.reduce((a, b) => a + b, 0) / avgMood.length : -1;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Header
          title="Трекер настроения"
          description="Отслеживайте своё самочувствие"
          actions={
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Отметить настроение
            </Button>
          }
        />
        <main className="p-6">
          {showForm && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-3">Как вы себя чувствуете?</h3>
                <div className="flex gap-3 mb-4">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMood(m.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        selectedMood === m.value
                          ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-110"
                          : "border-[var(--border)] hover:border-[var(--accent)]/30"
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[10px] text-[var(--secondary)]">{m.label}</span>
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Заметка (необязательно)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={!selectedMood}>
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setSelectedMood(null); setNote(""); }}>
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Left: History */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                История
              </h3>
              {loading ? (
                <div className="text-[var(--secondary)] text-sm">Загрузка...</div>
              ) : entries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
                    <Smile className="mb-3 h-10 w-10 opacity-50" />
                    <p>Пока нет записей</p>
                    <p className="text-xs mt-1">Нажмите &quot;Отметить настроение&quot;</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const mc = getMoodConfig(entry.mood);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <span className="text-2xl">{mc.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{mc.label}</span>
                            <span className="text-[10px] text-[var(--muted)]">
                              {new Date(entry.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-xs text-[var(--secondary)] mt-0.5 truncate">{entry.note}</p>
                          )}
                        </div>
                        <button onClick={() => handleDelete(entry.id)} className="text-[var(--error)] hover:opacity-70">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Week overview */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Эта неделя
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {weekDays.map((day, i) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const dayEntry = entries.find((e) => e.date === dateStr);
                      const mc = dayEntry ? getMoodConfig(dayEntry.mood) : null;
                      const isToday = dateStr === todayStr;
                      return (
                        <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isToday ? "bg-[var(--accent)]/5" : ""}`}>
                          <span className="text-xs text-[var(--secondary)] w-20">
                            {format(day, "EEE d", { locale: ru })}
                          </span>
                          {mc ? (
                            <span className="text-xl">{mc.emoji}</span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: mc ? `${100 - (MOODS.findIndex((m) => m.value === dayEntry!.mood) / (MOODS.length - 1)) * 100}%` : "0%",
                                backgroundColor: mc?.color || "transparent",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {moodAverage >= 0 && (
                    <div className="mt-4 pt-3 border-t border-[var(--border)] text-center">
                      <p className="text-xs text-[var(--secondary)]">Среднее настроение за неделю</p>
                      <p className="text-2xl mt-1">{MOODS[Math.round(moodAverage)]?.emoji}</p>
                      <p className="text-xs text-[var(--secondary)]">{MOODS[Math.round(moodAverage)]?.label}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="sticky top-0 z-30 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setOpen(true)} className="h-9 w-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center active:scale-95 transition-transform">
                <span className="text-sm font-bold text-[var(--accent)]">M</span>
              </button>
              <p className="text-lg font-bold">Настроение</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="h-9 px-3 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-24">
          {/* Quick mood */}
          {!showForm && (
            <div className="flex gap-2 justify-center">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={async () => {
                    const today = new Date().toISOString().split("T")[0];
                    await fetch("/api/mood", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ mood: m.value, date: today }),
                    });
                    fetchEntries();
                  }}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[9px] text-[var(--secondary)]">{m.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2 justify-center">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMood(m.value)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                        selectedMood === m.value
                          ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-110"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[9px]">{m.label}</span>
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Заметка..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button onClick={handleAdd} disabled={!selectedMood} className="w-full">
                  Сохранить
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Week chart */}
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-semibold mb-2">Эта неделя</p>
              <div className="flex gap-1">
                {weekDays.map((day, i) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayEntry = entries.find((e) => e.date === dateStr);
                  const mc = dayEntry ? getMoodConfig(dayEntry.mood) : null;
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={i} className={`flex-1 flex flex-col items-center gap-1 p-1 rounded-lg ${isToday ? "bg-[var(--accent)]/10" : ""}`}>
                      <span className="text-[9px] text-[var(--muted)]">{format(day, "EEEEE", { locale: ru })}</span>
                      <span className="text-lg">{mc?.emoji || "·"}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <div>
            <p className="text-xs font-semibold mb-2 px-1">История</p>
            {entries.length === 0 ? (
              <p className="text-center text-sm text-[var(--secondary)] py-8">Нет записей</p>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 14).map((entry) => {
                  const mc = getMoodConfig(entry.mood);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                      <span className="text-xl">{mc.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">{mc.label}</span>
                        <span className="text-[10px] text-[var(--muted)] ml-2">
                          {new Date(entry.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </span>
                        {entry.note && <p className="text-[10px] text-[var(--secondary)] truncate">{entry.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
