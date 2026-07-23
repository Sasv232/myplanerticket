"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "./topnav";
import { MobileNav } from "./mobile-nav";
import { MobileSidebar } from "./mobile-sidebar";
import { MobileSidebarProvider, useMobileSidebar } from "./mobile-sidebar-context";
import { PageTransition } from "@/components/ui/page-transition";

const PUBLIC_PATHS = ["/login", "/register"];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useMobileSidebar();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <MobileSidebar open={open} onClose={() => setOpen(false)} />
      <main className="desktop-main">
        <PageTransition>{children}</PageTransition>
      </main>
      <MobileNav />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </MobileSidebarProvider>
  );
}
