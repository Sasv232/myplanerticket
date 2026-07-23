"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, MessageSquare, Repeat, Timer } from "lucide-react";

const navItems = [
  { label: "Главная", href: "/", icon: Home },
  { label: "Задачи", href: "/tasks", icon: CheckSquare },
  { label: "Привычки", href: "/habits", icon: Repeat },
  { label: "Таймер", href: "/pomodoro", icon: Timer },
  { label: "Чат", href: "/messenger", icon: MessageSquare },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
