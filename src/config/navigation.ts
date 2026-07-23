import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  Bell,
  Timer,
  Sun,
  BarChart3,
  Repeat,
  FolderKanban,
  Music,
  BookOpen,
  Dumbbell,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    title: "Главная",
    items: [
      { label: "Дашборд", href: "/", icon: LayoutDashboard },
      { label: "Сегодня", href: "/today", icon: Sun },
      { label: "Задачи", href: "/tasks", icon: CheckSquare },
      { label: "Проекты", href: "/projects", icon: FolderKanban },
      { label: "Таймер", href: "/pomodoro", icon: Timer },
    ],
  },
  {
    title: "Продуктивность",
    items: [
      { label: "Привычки", href: "/habits", icon: Repeat },
      { label: "Статистика", href: "/stats", icon: BarChart3 },
    ],
  },
  {
    title: "Система",
    items: [
      { label: "Уведомления", href: "/notifications", icon: Bell },
      { label: "Настройки", href: "/settings", icon: Settings },
    ],
  },
  {
    title: "Записи",
    items: [
      { label: "Дневник", href: "/journal", icon: BookOpen },
    ],
  },
  {
    title: "Здоровье",
    items: [
      { label: "Фитнес", href: "/fitness", icon: Dumbbell },
    ],
  },
  {
    title: "Развлечения",
    items: [
      { label: "Синтезатор", href: "/synth", icon: Music },
    ],
  },
];
