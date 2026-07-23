export interface WidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export interface WidgetDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultSize: "sm" | "md" | "lg";
  minW?: number;
}

export const AVAILABLE_WIDGETS: WidgetDef[] = [
  { id: "task-stats", name: "Статистика задач", description: "Обзор задач по статусам", icon: "📊", color: "#2563eb", defaultSize: "md" },
  { id: "weather", name: "Погода", description: "Температура и условия", icon: "🌤️", color: "#06b6d4", defaultSize: "sm" },
  { id: "currency", name: "Валюта", description: "Курсы USD и EUR", icon: "💰", color: "#16a34a", defaultSize: "sm" },
  { id: "quote", name: "Цитата дня", description: "Мотивация на день", icon: "💬", color: "#8b5cf6", defaultSize: "md" },
  { id: "habits-today", name: "Привычки сегодня", description: "Прогресс за сегодня", icon: "✅", color: "#f59e0b", defaultSize: "md" },
  { id: "upcoming", name: "Ближайшие дедлайны", description: "Задачи с дедлайнами", icon: "📅", color: "#ef4444", defaultSize: "md" },
  { id: "pomodoro", name: "Pomodoro", description: "Быстрый запуск таймера", icon: "🍅", color: "#dc2626", defaultSize: "sm" },
  { id: "karma", name: "Карма", description: "Очки и серия", icon: "🔥", color: "#f97316", defaultSize: "sm" },
  { id: "quick-note", name: "Быстрая заметка", description: "Текстовая заметка", icon: "📝", color: "#64748b", defaultSize: "lg" },
  { id: "weekly-chart", name: "Недельная активность", description: "График за неделю", icon: "📈", color: "#2563eb", defaultSize: "lg" },
  { id: "mini-calendar", name: "Календарь", description: "Мини-календарь с задачами", icon: "📅", color: "#8b5cf6", defaultSize: "md" },
];

export const DEFAULT_WIDGETS: WidgetConfig[] = AVAILABLE_WIDGETS.map((w, i) => ({
  id: w.id,
  enabled: ["task-stats", "weather", "currency", "habits-today", "upcoming", "mini-calendar"].includes(w.id),
  order: i,
}));

export function loadWidgetConfig(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedIds = new Set(parsed.map((w: WidgetConfig) => w.id));
        const missing = DEFAULT_WIDGETS.filter((w) => !savedIds.has(w.id));
        return [...parsed, ...missing];
      }
    }
  } catch {}
  return DEFAULT_WIDGETS;
}

export function saveWidgetConfig(config: WidgetConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("dashboard-widgets", JSON.stringify(config));
}
