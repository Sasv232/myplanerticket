"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, Repeat, Timer, Grid3X3 } from "lucide-react";
import { useMobileSidebar } from "./mobile-sidebar-context";
import { useState, useEffect, useRef } from "react";

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
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        if (y < 10) {
          setHidden(false);
        } else if (delta > 8) {
          setHidden(true);
        } else if (delta < -8) {
          setHidden(false);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={cn("mobile-nav", hidden && "mobile-nav-hidden")}>
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
