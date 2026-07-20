"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

type TimerMode = "work" | "break";

const PRESETS = {
  work: 25 * 60,
  break: 5 * 60,
};

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = "sine";
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
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
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setIsRunning(false);
        playBeep();
        if (mode === "work") {
          setSessions((s) => s + 1);
          setMode("break");
          return PRESETS.break;
        } else {
          setMode("work");
          return PRESETS.work;
        }
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(PRESETS.work);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const circumference = 2 * Math.PI * 90;
  const dashoffset = circumference - (progress / 100) * circumference;

  return (
    <div>
      <Header title="Таймер" description="Pomodoro — сосредоточься на задаче" />
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          <Button
            variant={mode === "work" ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode("work"); setTimeLeft(PRESETS.work); setIsRunning(false); }}
          >
            <Brain className="h-4 w-4" /> Работа (25м)
          </Button>
          <Button
            variant={mode === "break" ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode("break"); setTimeLeft(PRESETS.break); setIsRunning(false); }}
          >
            <Coffee className="h-4 w-4" /> Перерыв (5м)
          </Button>
        </div>

        <Card className="w-64 h-64 flex items-center justify-center relative">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke={mode === "work" ? "var(--accent)" : "var(--success)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="text-center z-10">
            <p className="text-5xl font-bold font-mono tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm text-[var(--secondary)]">
              {mode === "work" ? "Работа" : "Перерыв"}
            </p>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button size="lg" onClick={toggle}>
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {isRunning ? "Пауза" : "Старт"}
          </Button>
          <Button variant="outline" size="lg" onClick={reset}>
            <RotateCcw className="h-5 w-5" />
            Сброс
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-[var(--secondary)]">
          <span>Сессий завершено: <strong className="text-[var(--foreground)]">{sessions}</strong></span>
        </div>
      </div>
    </div>
  );
}
