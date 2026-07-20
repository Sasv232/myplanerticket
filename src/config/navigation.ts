import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Calendar,
  Settings,
  Bell,
  Timer,
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
      { label: "Задачи", href: "/tasks", icon: CheckSquare },
      { label: "Доска", href: "/board", icon: Kanban },
      { label: "Календарь", href: "/calendar", icon: Calendar },
      { label: "Таймер", href: "/pomodoro", icon: Timer },
    ],
  },
  {
    title: "Система",
    items: [
      { label: "Уведомления", href: "/notifications", icon: Bell },
      { label: "Настройки", href: "/settings", icon: Settings },
    ],
  },
];
