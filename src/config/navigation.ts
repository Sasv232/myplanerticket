import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Calendar,
  Train,
  Settings,
  Bell,
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
    ],
  },
  {
    title: "Трекеры",
    items: [
      { label: "РЖД", href: "/trackers/rzd", icon: Train },
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
