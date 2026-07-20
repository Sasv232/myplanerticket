"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "@/config/navigation";
import { useState } from "react";
import { Menu, X, Train, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--card)] border border-[var(--border)] lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-60 border-r border-[var(--border)] bg-[var(--sidebar)] flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-5">
          <Train className="h-5 w-5 text-[var(--accent)]" />
          <span className="text-lg font-bold tracking-tight">MyPlanerTicket</span>
          <button
            onClick={toggle}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface)] transition-colors"
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[var(--secondary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--secondary)]" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--secondary)]">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                          isActive
                            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "text-[var(--secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {item.badge !== undefined && (
                          <span className="ml-auto rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-4 space-y-2">
          {user && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs font-bold text-[var(--accent)]">
                {user.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate">{user.name}</span>
              <button
                onClick={handleLogout}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--surface)] transition-colors"
                title="Выйти"
              >
                <LogOut className="h-3.5 w-3.5 text-[var(--secondary)]" />
              </button>
            </div>
          )}
          <p className="text-xs text-[var(--secondary)] text-center">
            v0.1.0 — Personal
          </p>
        </div>
      </aside>
    </>
  );
}
