"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/config/use-navigation";
import { useEffect } from "react";
import { Train, Sun, Moon, LogOut, Shield, X } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n/context";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { t } = useLang();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    onClose();
    router.push("/login");
  };

  const handleNav = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-[70] h-full w-72 bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Train className="h-4.5 w-4.5 text-[var(--accent)]" />
          </div>
          <span className="text-lg font-bold tracking-tight">MyPlanerTicket</span>
          <button
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[var(--surface)] transition-all duration-150"
          >
            <X className="h-4 w-4 text-[var(--secondary)]" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-sm font-bold text-[var(--accent)]">
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-[11px] text-[var(--secondary)] truncate">{user.role === "admin" ? t("common_admin") : t("common_user")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group) => (
            <div key={group.title} className="mb-5">
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
                      <button
                        onClick={() => handleNav(item.href)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150 text-left",
                          isActive
                            ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_3px_0_0_0_var(--accent)]"
                            : "text-[var(--secondary)] active:bg-[var(--surface)]"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {user?.role === "admin" && (
            <div className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                Управление
              </p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => handleNav("/admin")}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150 text-left",
                      pathname === "/admin"
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_3px_0_0_0_var(--accent)]"
                        : "text-[var(--secondary)] active:bg-[var(--surface)]"
                    )}
                  >
                    <Shield className="h-5 w-5 shrink-0" />
                    {t("admin_title")}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-4 space-y-3">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[var(--secondary)] active:bg-[var(--surface)] transition-all"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {theme === "dark" ? t("common_theme_light") : t("common_theme_dark")}
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[var(--error)] active:bg-[var(--error)]/10 transition-all"
            >
              <LogOut className="h-5 w-5" />
              {t("common_logout")}
            </button>
          )}
          <p className="text-[10px] text-[var(--muted)] text-center font-medium">
            v0.2.0 — {t("common_version")}
          </p>
        </div>
      </aside>
    </>
  );
}
