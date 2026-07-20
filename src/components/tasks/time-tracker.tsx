"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Clock, Trash2 } from "lucide-react";

interface TimeEntry {
  id: string;
  taskId: string;
  duration: number;
  note: string | null;
  startedAt: string;
  createdAt: string;
}

interface TimeTrackerProps {
  taskId: string;
}

export function TimeTracker({ taskId }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const fetchEntries = async () => {
    try {
      const res = await fetch(`/api/time-entries?taskId=${taskId}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotalMinutes(data.totalMinutes || 0);
    } catch {}
  };

  useEffect(() => {
    fetchEntries();
  }, [taskId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const start = () => {
    startTimeRef.current = new Date();
    setElapsed(0);
    setIsRunning(true);
  };

  const stop = async () => {
    setIsRunning(false);
    if (!startTimeRef.current) return;

    const durationSec = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
    const durationMin = Math.max(1, Math.ceil(durationSec / 60));

    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        duration: durationMin,
        note: note || null,
        startedAt: startTimeRef.current.toISOString(),
      }),
    });

    setNote("");
    setElapsed(0);
    startTimeRef.current = null;
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await fetch(`/api/time-entries?id=${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-sm font-medium">Отслеживание времени</span>
        <span className="text-xs text-[var(--secondary)]">
          Всего: {formatDuration(totalMinutes)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button size="sm" onClick={start}>
            <Play className="h-3.5 w-3.5" /> Старт
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={stop}>
            <Square className="h-3.5 w-3.5" /> Стоп ({formatTime(elapsed)})
          </Button>
        )}
        {isRunning && (
          <input
            type="text"
            placeholder="Заметка..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs"
          />
        )}
      </div>

      {entries.length > 0 && (
        <div className="space-y-1">
          {entries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded border border-[var(--border)] px-2 py-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{formatDuration(entry.duration)}</span>
                {entry.note && <span className="text-[var(--secondary)]">{entry.note}</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[var(--secondary)]">
                  {new Date(entry.startedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </span>
                <button onClick={() => deleteEntry(entry.id)} className="ml-1 text-[var(--error)] hover:opacity-70">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
