import { TasksPageDesktop } from "./page.desktop";
import { TasksPageMobile } from "./page.mobile";
import { Suspense } from "react";

export default function TasksPage() {
  return (
    <>
      <div className="hidden md:block">
        <TasksPageDesktop />
      </div>
      <div className="md:hidden">
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="text-[var(--secondary)]">Загрузка...</div></div>}>
          <TasksPageMobile />
        </Suspense>
      </div>
    </>
  );
}
