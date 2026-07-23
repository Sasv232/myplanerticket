"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/config/use-navigation";
import { useEffect } from "react";
import { X, LogOut, Shield } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/user-avatar";
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
          "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-[70] h-full w-[300px] bg-[var(--background)] flex flex-col transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <div className="flex justify-end p-5">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all duration-150"
          >
            <X className="h-5 w-5 text-[var(--secondary)]" />
          </button>
        </div>

        {/* User profile card */}
        {user && (
          <div className="px-6 pb-8">
            <div className="flex flex-col items-center">
              <UserAvatar src={user.avatar} name={user.name} size="xl" className="mb-4" />
              <h2 className="text-lg font-bold text-center">{user.name}</h2>
              <p className="text-sm text-[var(--secondary)] mt-0.5">
                {user.role === "admin" ? t("common_admin") : t("common_user")}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4">
          {navigation.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? "mt-6" : ""}>
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {group.title}
              </p>
              <ul className="space-y-1">
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
                          "w-full flex items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all duration-150 text-left min-h-[48px]",
                          isActive
                            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
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
            <div className="mt-6">
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Управление
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleNav("/admin")}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all duration-150 text-left min-h-[48px]",
                      pathname === "/admin"
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
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
        <div className="border-t border-[var(--border)] p-4 space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-medium text-[var(--secondary)] active:bg-[var(--surface)] transition-all min-h-[48px]"
          >
            {theme === "dark" ? "☀️" : "🌙"}
            {theme === "dark" ? t("common_theme_light") : t("common_theme_dark")}
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-medium text-[var(--error)] active:bg-[var(--error)]/10 transition-all min-h-[48px]"
            >
              <LogOut className="h-5 w-5" />
              {t("common_logout")}
            </button>
          )}
          <p className="text-[11px] text-[var(--muted)] text-center font-medium pt-2">
            v0.3.0
          </p>
        </div>
      </aside>
    </>
  );
}
