"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { useTheme } from "./theme-provider";
import { Zap, LogOut, Bell, Settings, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const NAV_MAIN = [
  { label: "Дашборд", href: "/" },
  { label: "Задачи", href: "/tasks" },
  { label: "Проекты", href: "/projects" },
  { label: "Привычки", href: "/habits" },
  { label: "Таймер", href: "/pomodoro" },
];

const NAV_MORE = [
  { label: "Сегодня", href: "/today" },
  { label: "Статистика", href: "/stats" },
  { label: "Журнал", href: "/journal" },
  { label: "Фитнес", href: "/fitness" },
  { label: "Мессенджер", href: "/messenger" },
  { label: "Синтезатор", href: "/synth" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isMoreActive = NAV_MORE.some(item => isActive(item.href));

  return (
    <nav className="topnav">
      <Link href="/" className="topnav-logo">
        <div className="topnav-logo-icon">
          <Zap className="h-4 w-4" />
        </div>
        <span className="hidden sm:inline">MyPlaner</span>
      </Link>

      <div className="topnav-links">
        {NAV_MAIN.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("topnav-link", isActive(item.href) && "topnav-link-active")}
          >
            {item.label}
          </Link>
        ))}

        {/* More dropdown */}
        <div ref={moreRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn("topnav-link", isMoreActive && "topnav-link-active")}
            style={{ gap: 4 }}
          >
            Ещё
            <ChevronDown className="h-3 w-3" style={{ transition: "transform 0.15s", transform: showMore ? "rotate(180deg)" : "none" }} />
          </button>
          {showMore && (
            <div
              style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                marginTop: 8, width: 180, padding: "6px 0", borderRadius: "var(--radius-md)",
                background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
                zIndex: 200,
              }}
            >
              {NAV_MORE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: "block", padding: "8px 16px", fontSize: 13, fontWeight: 500,
                    color: isActive(item.href) ? "var(--primary)" : "var(--text-secondary)",
                    background: isActive(item.href) ? "var(--primary-light)" : "transparent",
                    textDecoration: "none", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = "var(--bg-alt)"; }}
                  onMouseLeave={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = "transparent"; }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="topnav-right">
        <ThemeSwitch checked={theme === "dark"} onChange={toggle} />

        <Link href="/notifications" className="btn-icon" style={{ width: 32, height: 32 }}>
          <Bell className="h-4 w-4" />
        </Link>

        {user?.role === "admin" && (
          <Link href="/admin" className="btn-icon" style={{ width: 32, height: 32 }}>
            <Settings className="h-4 w-4" />
          </Link>
        )}

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 p-0.5 rounded-full transition-all hover:bg-[var(--bg-alt)]"
            >
              <UserAvatar src={user.avatar} name={user.name} size="sm" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 8, width: 200,
                  padding: "6px 0", borderRadius: "var(--radius-md)", background: "var(--surface)",
                  border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", zIndex: 50,
                }} className="animate-scale">
                  <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                    <p className="text-sm" style={{ fontWeight: 600 }}>{user.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.email || "Пользователь"}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setShowMenu(false)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-alt)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Settings className="h-4 w-4" /> Настройки
                  </Link>
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, color: "var(--error)", width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-alt)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <LogOut className="h-4 w-4" /> Выйти
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
