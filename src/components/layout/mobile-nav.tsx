"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CheckSquare, Calendar, Settings, Plus } from "lucide-react";

const navItems = [
  { label: "Главная", href: "/", icon: LayoutDashboard },
  { label: "Задачи", href: "/tasks", icon: CheckSquare },
  { label: "Календарь", href: "/calendar", icon: Calendar },
  { label: "Настройки", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/tasks?new=true"
        className="mobile-fab"
        aria-label="Новая задача"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mobile-nav-item",
                  isActive && "mobile-nav-item-active"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
