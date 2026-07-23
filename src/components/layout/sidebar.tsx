"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/config/use-navigation";
import { useState } from "react";
import { Menu, X, Train, Sun, Moon, LogOut, Shield } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLang } from "@/lib/i18n/context";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { t } = useLang();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "sidebar-desktop fixed left-0 top-0 z-40 h-full w-60 border-r border-[var(--border)] bg-[var(--sidebar)] flex flex-col transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Train className="h-4.5 w-4.5 text-[var(--accent)]" />
          </div>
          <span className="text-lg font-bold tracking-tight">MyPlanerTicket</span>
          <button
            onClick={toggle}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[var(--surface)] transition-all duration-150"
            title={theme === "dark" ? t("common_theme_light") : t("common_theme_dark")}
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
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
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
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ease-in-out",
                          isActive
                            ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_3px_0_0_0_var(--accent)]"
                            : "text-[var(--secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {item.label}
                        {item.badge !== undefined && (
                          <span className="ml-auto rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white">
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
          {user?.role === "admin" && (
            <div className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                Управление
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ease-in-out",
                      pathname === "/admin"
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_3px_0_0_0_var(--accent)]"
                        : "text-[var(--secondary)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Shield className="h-[18px] w-[18px] shrink-0" />
                    {t("admin_title")}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="border-t border-[var(--border)] p-4 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 px-2">
              <UserAvatar src={user.avatar} name={user.name} size="md" />
              <span className="text-sm font-medium truncate">{user.name}</span>
              <button
                onClick={handleLogout}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-xl hover:bg-[var(--surface)] transition-all duration-150"
                title={t("common_logout")}
              >
                <LogOut className="h-3.5 w-3.5 text-[var(--secondary)]" />
              </button>
            </div>
          )}
          <p className="text-[10px] text-[var(--muted)] text-center font-medium">
            v0.2.0 — {t("common_version")}
          </p>
        </div>
      </aside>
    </>
  );
}
