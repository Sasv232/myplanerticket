"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileHeader } from "./mobile-header";
import { PageTransition } from "@/components/ui/page-transition";

const PUBLIC_PATHS = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 desktop-main mobile-main">
        <MobileHeader />
        <div className="mobile-content">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
