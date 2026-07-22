import { MessengerDesktop } from "./page.desktop";
import { MessengerMobile } from "./page.mobile";
import { Suspense } from "react";

export default function MessengerPage() {
  return (
    <>
      <div className="hidden md:block">
        <MessengerDesktop />
      </div>
      <div className="md:hidden">
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="text-[var(--secondary)]">Загрузка...</div></div>}>
          <MessengerMobile />
        </Suspense>
      </div>
    </>
  );
}
