"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { useTheme } from "./theme-provider";
import { Zap, LogOut, Bell } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Дашборд", href: "/" },
  { label: "Задачи", href: "/tasks" },
  { label: "Проекты", href: "/projects" },
  { label: "Привычки", href: "/habits" },
  { label: "Таймер", href: "/pomodoro" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="topnav">
      <Link href="/" className="topnav-logo">
        <div className="topnav-logo-icon">
          <Zap className="h-4 w-4" />
        </div>
        <span className="hidden sm:inline">MyPlanerTicket</span>
      </Link>

      <div className="topnav-links">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("topnav-link", isActive && "topnav-link-active")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="topnav-right">
        <ThemeSwitch checked={theme === "dark"} onChange={toggle} />

        <Link
          href="/notifications"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-[var(--bg-alt)] relative"
        >
          <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
        </Link>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-full p-0.5 transition-all hover:bg-[var(--bg-alt)]"
            >
              <UserAvatar src={user.avatar} name={user.name} size="sm" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[var(--card)] border border-[var(--border-light)] shadow-[var(--shadow-lg)] py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-[var(--border)]">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{user.email || "Пользователь"}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-alt)] transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    Настройки
                  </Link>
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--error)] hover:bg-[var(--bg-alt)] transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
