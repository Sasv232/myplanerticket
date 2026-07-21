"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "light" | "dark";

interface ScheduleConfig {
  enabled: boolean;
  darkHour: number;
  lightHour: number;
}

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  schedule: ScheduleConfig;
  setSchedule: (config: ScheduleConfig) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggle: () => {},
  schedule: { enabled: false, darkHour: 21, lightHour: 7 },
  setSchedule: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getThemeByTime(schedule: ScheduleConfig): Theme {
  const now = new Date();
  const hour = now.getHours();
  const { darkHour, lightHour } = schedule;

  if (darkHour > lightHour) {
    return hour >= darkHour || hour < lightHour ? "dark" : "light";
  } else {
    return hour >= darkHour && hour < lightHour ? "dark" : "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const [schedule, setScheduleState] = useState<ScheduleConfig>({
    enabled: false,
    darkHour: 21,
    lightHour: 7,
  });

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedSchedule = localStorage.getItem("theme-schedule");

    let sched: ScheduleConfig = { enabled: false, darkHour: 21, lightHour: 7 };
    if (savedSchedule) {
      try { sched = JSON.parse(savedSchedule); } catch {}
    }
    setScheduleState(sched);

    if (sched.enabled) {
      setTheme(getThemeByTime(sched));
    } else if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || !schedule.enabled) return;
    const interval = setInterval(() => {
      setTheme(getThemeByTime(schedule));
    }, 60000);
    return () => clearInterval(interval);
  }, [mounted, schedule]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const setSchedule = useCallback((config: ScheduleConfig) => {
    setScheduleState(config);
    localStorage.setItem("theme-schedule", JSON.stringify(config));
    if (config.enabled) {
      setTheme(getThemeByTime(config));
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, schedule, setSchedule }}>
      {children}
    </ThemeContext.Provider>
  );
}
