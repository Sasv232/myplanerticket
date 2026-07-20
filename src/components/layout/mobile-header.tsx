"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Bell } from "lucide-react";
import Link from "next/link";

interface MobileHeaderProps {
  title?: string;
  actions?: ReactNode;
}

export function MobileHeader({ title, actions }: MobileHeaderProps) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="mobile-header">
      <div className="mobile-header-left">
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs font-bold text-[var(--accent)]">
            {user.name[0].toUpperCase()}
          </div>
        )}
        {title && <span className="text-sm font-semibold">{title}</span>}
      </div>
      <div className="mobile-header-right">
        {actions}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface)] transition-colors"
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-[var(--secondary)]" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--secondary)]" />
          )}
        </button>
        <Link
          href="/notifications"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface)] transition-colors"
        >
          <Bell className="h-4 w-4 text-[var(--secondary)]" />
        </Link>
      </div>
    </div>
  );
}
