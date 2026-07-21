"use client";

import { useMemo } from "react";
import { WidgetConfig, AVAILABLE_WIDGETS } from "@/lib/widgets";
import { WidgetCard } from "./widget-card";
import {
  TaskStatsWidget,
  WeatherWidget,
  CurrencyWidget,
  QuoteWidget,
  HabitsTodayWidget,
  UpcomingWidget,
  PomodoroWidget,
  KarmaWidget,
  QuickNoteWidget,
  WeeklyChartWidget,
} from "./widget-registry";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ compact?: boolean }>> = {
  "task-stats": TaskStatsWidget,
  "weather": WeatherWidget,
  "currency": CurrencyWidget,
  "quote": QuoteWidget,
  "habits-today": HabitsTodayWidget,
  "upcoming": UpcomingWidget,
  "pomodoro": PomodoroWidget,
  "karma": KarmaWidget,
  "quick-note": QuickNoteWidget,
  "weekly-chart": WeeklyChartWidget,
};

interface WidgetRendererProps {
  config: WidgetConfig[];
  columns?: 2 | 3;
}

export function WidgetRenderer({ config, columns = 2 }: WidgetRendererProps) {
  const enabled = useMemo(() => {
    return config
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [config]);

  if (enabled.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🎨</p>
        <p className="text-[15px] font-semibold mb-1">Нет виджетов</p>
        <p className="text-[12px] text-[var(--secondary)]">Нажмите настройки чтобы добавить виджеты</p>
      </div>
    );
  }

  // Split widgets into columns for masonry-like layout
  const colCount = columns;
  const cols: typeof enabled[] = Array.from({ length: colCount }, () => []);
  enabled.forEach((w, i) => {
    cols[i % colCount].push(w);
  });

  return (
    <div className="flex gap-4">
      {cols.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 space-y-4">
          {col.map((w) => {
            const def = AVAILABLE_WIDGETS.find((d) => d.id === w.id);
            const Comp = WIDGET_COMPONENTS[w.id];
            if (!def || !Comp) return null;
            return (
              <WidgetCard key={w.id} widget={def} compact={def.defaultSize === "sm"}>
                <Comp compact={def.defaultSize === "sm"} />
              </WidgetCard>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Mobile: single column, full width
export function WidgetRendererMobile({ config }: { config: WidgetConfig[] }) {
  const enabled = useMemo(() => {
    return config
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [config]);

  if (enabled.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-2">🎨</p>
        <p className="text-[14px] font-semibold mb-1">Нет виджетов</p>
        <p className="text-[11px] text-[var(--secondary)]">Настройте дашборд через иконку ⚙️</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enabled.map((w) => {
        const def = AVAILABLE_WIDGETS.find((d) => d.id === w.id);
        const Comp = WIDGET_COMPONENTS[w.id];
        if (!def || !Comp) return null;
        return (
          <WidgetCard key={w.id} widget={def}>
            <Comp />
          </WidgetCard>
        );
      })}
    </div>
  );
}
