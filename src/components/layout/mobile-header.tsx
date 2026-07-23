"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMobileSidebar } from "./mobile-sidebar-context";
import { UserAvatar } from "@/components/ui/user-avatar";

interface MobileHeaderProps {
  title?: string;
  actions?: ReactNode;
}

export function MobileHeader({ title, actions }: MobileHeaderProps) {
  const { user } = useAuth();
  const { setOpen } = useMobileSidebar();

  return (
    <div className="mobile-header">
      <div className="mobile-header-left">
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all duration-150"
        >
          <UserAvatar src={user?.avatar} name={user?.name || "M"} size="sm" />
        </button>
        {title && <span className="text-base font-bold">{title}</span>}
      </div>
      {actions && <div className="mobile-header-right">{actions}</div>}
    </div>
  );
}
