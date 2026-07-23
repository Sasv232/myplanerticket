"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, MessageSquare, Repeat, Timer, Grid3X3 } from "lucide-react";
import { useMobileSidebar } from "./mobile-sidebar-context";

const navItems = [
  { label: "Главная", href: "/", icon: Home },
  { label: "Задачи", href: "/tasks", icon: CheckSquare },
  { label: "Привычки", href: "/habits", icon: Repeat },
  { label: "Таймер", href: "/pomodoro", icon: Timer },
  { label: "Ещё", href: "__sidebar__", icon: Grid3X3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setOpen } = useMobileSidebar();

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "__sidebar__" ? false : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

          if (item.href === "__sidebar__") {
            return (
              <button
                key="more"
                onClick={() => setOpen(true)}
                className="mobile-nav-item"
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("mobile-nav-item", isActive && "mobile-nav-item-active")}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
