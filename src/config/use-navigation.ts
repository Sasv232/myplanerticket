"use client";

import { useLang } from "@/lib/i18n/context";
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Calendar,
  Settings,
  Bell,
  Timer,
  Sun,
  BarChart3,
  Repeat,
  FolderKanban,
  Music,
  StickyNote,
  BookOpen,
  Dumbbell,
  Smile,
  MessageCircle,
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

export function useNavigation() {
  const { t } = useLang();

  const navigation: NavGroup[] = [
    {
      title: t("group_main"),
      items: [
        { label: t("nav_dashboard"), href: "/", icon: LayoutDashboard },
        { label: t("nav_today"), href: "/today", icon: Sun },
        { label: t("nav_tasks"), href: "/tasks", icon: CheckSquare },
        { label: t("nav_projects"), href: "/projects", icon: FolderKanban },
        { label: t("nav_board"), href: "/board", icon: Kanban },
        { label: t("nav_calendar"), href: "/calendar", icon: Calendar },
        { label: t("nav_timer"), href: "/pomodoro", icon: Timer },
      ],
    },
    {
      title: t("group_productivity"),
      items: [
        { label: t("nav_habits"), href: "/habits", icon: Repeat },
        { label: t("nav_stats"), href: "/stats", icon: BarChart3 },
      ],
    },
    {
      title: t("group_system"),
      items: [
        { label: t("nav_messenger"), href: "/messenger", icon: MessageCircle },
        { label: t("nav_notifications"), href: "/notifications", icon: Bell },
        { label: t("nav_settings"), href: "/settings", icon: Settings },
      ],
    },
    {
      title: t("group_records"),
      items: [
        { label: t("nav_notes"), href: "/notes", icon: StickyNote },
        { label: t("nav_journal"), href: "/journal", icon: BookOpen },
      ],
    },
    {
      title: t("group_health"),
      items: [
        { label: t("nav_fitness"), href: "/fitness", icon: Dumbbell },
        { label: "Настроение", href: "/mood", icon: Smile },
      ],
    },
    {
      title: t("group_fun"),
      items: [
        { label: t("nav_synth"), href: "/synth", icon: Music },
      ],
    },
  ];

  return navigation;
}
