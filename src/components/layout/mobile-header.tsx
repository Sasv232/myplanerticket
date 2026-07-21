"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMobileSidebar } from "./mobile-sidebar-context";
import { Menu, X } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  actions?: ReactNode;
}

export function MobileHeader({ title, actions }: MobileHeaderProps) {
  const { user } = useAuth();
  const { open, setOpen } = useMobileSidebar();

  return (
    <div className="mobile-header">
      <div className="mobile-header-left">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] transition-all duration-150 active:scale-95"
        >
          {open ? (
            <X className="h-4 w-4 text-[var(--foreground)]" />
          ) : user ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[11px] font-bold text-[var(--accent)]">
              {user.name[0].toUpperCase()}
            </div>
          ) : (
            <Menu className="h-4 w-4 text-[var(--foreground)]" />
          )}
        </button>
        {title && <span className="text-sm font-semibold">{title}</span>}
      </div>
      <div className="mobile-header-right">
        {actions}
      </div>
    </div>
  );
}
