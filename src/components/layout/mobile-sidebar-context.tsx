"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface MobileSidebarCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<MobileSidebarCtx>({ open: false, setOpen: () => {} });

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMobileSidebar() {
  return useContext(Ctx);
}
