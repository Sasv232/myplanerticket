"use client";

import { useState, useEffect } from "react";
import { Plus, Flame, Trash2, X, Check } from "lucide-react";

interface HabitLog { id: string; habitId: string; date: string; count: number; }
interface Habit { id: string; name: string; emoji: string; color: string; frequency: string; targetCount: number; logs: HabitLog[]; }

const EMOJIS = ["🏋️","📚","💧","🧘","🏃","✍️","🎯","💊","🌅","😴","🧹","🎵","💻","🥗","🐕","📝"];
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
const FREQ: Record<string, string> = { daily: "Ежедневно", weekly: "Еженедельно", monthly: "Ежемесячно" };

function today() { return new Date().toISOString().split("T")[0]; }
function dayKey(d: Date) { return d.toISOString().split("T")[0]; }
function streak(logs: HabitLog[], freq: string): number {
  const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
  if (!dates.length) return 0;
  const t = today();
  if (dates[0] !== t) { const y = dayKey(new Date(Date.now() - 86400000)); if (dates[0] !== y) return 0; }
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
  const logDates = new Set(habit.logs.map(l => l.date));
  const days: { date: string; done: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ date: dayKey(d), done: logDates.has(dayKey(d)) });
  }
  return (
    <div className="flex gap-[3px] flex-wrap">
      {days.map(day => (
        <div key={day.date} title={day.date} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: day.done ? habit.color : "var(--bg-alt)" }} />
      ))}
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("🎯");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formFreq, setFormFreq] = useState("daily");

  const fetchHabits = async () => {
    try { const res = await fetch("/api/habits"); const data = await res.json(); if (Array.isArray(data)) setHabits(data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchHabits(); }, []);

  const handleToggle = async (id: string) => {
    await fetch(`/api/habits/${id}/toggle`, { method: "POST" });
    fetchHabits();
  };
  const handleDelete = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  };
  const handleCreate = async () => {
    if (!formName.trim()) return;
    await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formName.trim(), emoji: formEmoji, color: formColor, frequency: formFreq, targetCount: 1 }) });
    setFormName(""); setFormEmoji("🎯"); setFormColor(COLORS[0]); setFormFreq("daily"); setFormOpen(false); fetchHabits();
  };

  const doneToday = habits.filter(h => h.logs.some(l => l.date === today())).length;

  if (loading) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <div className="empty-state" style={{ minHeight: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-xl" style={{ marginBottom: 4 }}>Привычки</h1>
          <p className="text-body">{doneToday}/{habits.length} выполнено сегодня</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> Новая привычка</button>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span className="text-caption" style={{ fontWeight: 600 }}>Прогресс дня</span>
          <span className="text-caption">{habits.length > 0 ? Math.round(doneToday / habits.length * 100) : 0}%</span>
        </div>
        <div className="progress"><div className="progress-fill progress-fill-mint" style={{ width: `${habits.length > 0 ? (doneToday / habits.length * 100) : 0}%` }} /></div>
      </div>

      {/* Habits grid */}
      {habits.length === 0 ? (
        <div className="empty-state" style={{ padding: 64 }}>
          <div className="empty-state-icon"><Flame className="h-8 w-8" /></div>
          <p className="empty-state-title">Нет привычек</p>
          <p className="empty-state-desc" style={{ marginBottom: 16 }}>Создай первую привычку, чтобы начать отслеживать</p>
          <button onClick={() => setFormOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> Создать привычку</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {habits.map(habit => {
            const done = habit.logs.some(l => l.date === today());
            const s = streak(habit.logs, habit.frequency);
            return (
              <div key={habit.id} className="card" style={{ padding: 20 }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 28 }}>{habit.emoji}</span>
                    <div>
                      <p className="heading-sm">{habit.name}</p>
                      <span className="badge badge-outline" style={{ marginTop: 2 }}>{FREQ[habit.frequency]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s > 0 && <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--warning)" }}><Flame className="h-3.5 w-3.5" /> {s}</span>}
                    <button onClick={() => handleDelete(habit.id)} className="btn-icon btn-icon-sm" style={{ color: "var(--text-muted)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <MiniGrid habit={habit} />
                <button
                  onClick={() => handleToggle(habit.id)}
                  className="btn"
                  style={{
                    width: "100%", marginTop: 12, height: 40,
                    background: done ? habit.color : "transparent",
                    color: done ? "white" : habit.color,
                    border: done ? "none" : `2px dashed ${habit.color}40`,
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <Check className="h-4 w-4" /> {done ? "Выполнено" : "Отметить"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create form modal */}
      {formOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setFormOpen(false)} />
          <div className="card animate-scale" style={{ padding: 28, width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <p className="heading-md">Новая привычка</p>
              <button onClick={() => setFormOpen(false)} className="btn-icon btn-icon-sm"><X className="h-4 w-4" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="label">Название</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="input" placeholder="Например: Медитация" autoFocus />
              </div>
              <div>
                <label className="label">Эмодзи</label>
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setFormEmoji(e)} style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", border: formEmoji === e ? "2px solid var(--primary)" : "1px solid var(--border)", background: formEmoji === e ? "var(--primary-light)" : "var(--surface)", fontSize: 18, cursor: "pointer" }}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Цвет</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setFormColor(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: formColor === c ? "3px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Частота</label>
                <div className="pill-nav" style={{ display: "flex" }}>
                  {Object.entries(FREQ).map(([k, v]) => (
                    <button key={k} onClick={() => setFormFreq(k)} className={`pill-nav-item ${formFreq === k ? "pill-nav-item-active" : ""}`}>{v}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} className="btn btn-primary" style={{ width: "100%" }}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
