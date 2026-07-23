"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

type TimerMode = "work" | "break";

const PRESETS = { work: 25 * 60, break: 5 * 60 };

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; osc.type = "sine"; gain.gain.value = 0.3;
    osc.start(); osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => {
      const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.value = 1000; osc2.type = "sine"; gain2.gain.value = 0.3;
      osc2.start(); osc2.stop(ctx.currentTime + 0.3);
    }, 350);
  } catch {}
}

export default function PomodoroPage() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(PRESETS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const total = PRESETS[mode];
  const progress = ((total - timeLeft) / total) * 100;

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        setIsRunning(false); playBeep();
        if (mode === "work") { setSessions(s => s + 1); setMode("break"); return PRESETS.break; }
        else { setMode("work"); return PRESETS.work; }
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (isRunning) { intervalRef.current = setInterval(tick, 1000); }
    else if (intervalRef.current) { clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => { setIsRunning(false); setMode("work"); setTimeLeft(PRESETS.work); };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const circumference = 2 * Math.PI * 90;
  const dashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="heading-xl" style={{ marginBottom: 4 }}>Таймер</h1>
        <p className="text-body">Pomodoro — сосредоточься на важном</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {/* Mode toggle */}
        <div className="pill-nav">
          <button onClick={() => { setMode("work"); setTimeLeft(PRESETS.work); setIsRunning(false); }} className={`pill-nav-item ${mode === "work" ? "pill-nav-item-active" : ""}`}>
            <Brain className="h-4 w-4" /> Работа
          </button>
          <button onClick={() => { setMode("break"); setTimeLeft(PRESETS.break); setIsRunning(false); }} className={`pill-nav-item ${mode === "break" ? "pill-nav-item-active" : ""}`}>
            <Coffee className="h-4 w-4" /> Перерыв
          </button>
        </div>

        {/* Timer circle */}
        <div className="card" style={{ width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: "50%" }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="100" cy="100" r="90" fill="none" stroke={mode === "work" ? "var(--primary)" : "var(--mint)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={{ textAlign: "center", zIndex: 1 }}>
            <p style={{ fontSize: 48, fontWeight: 700, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </p>
            <p className="text-muted" style={{ marginTop: 4 }}>{mode === "work" ? "Работа" : "Перерыв"}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button onClick={toggle} className="btn btn-primary btn-lg" style={{ minWidth: 140 }}>
            {isRunning ? <><Pause className="h-5 w-5" /> Пауза</> : <><Play className="h-5 w-5" /> Старт</>}
          </button>
          <button onClick={reset} className="btn btn-outline btn-lg">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {/* Sessions */}
        <div className="card" style={{ padding: "12px 24px" }}>
          <span className="text-caption">Сессий завершено: <strong style={{ color: "var(--text)" }}>{sessions}</strong></span>
        </div>
      </div>
    </div>
  );
}
