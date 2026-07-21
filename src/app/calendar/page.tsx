import { CalendarPageDesktop } from "./page.desktop";
import { CalendarPageMobile } from "./page.mobile";

export default function CalendarPage() {
  return (
    <>
      <div className="hidden md:block">
        <CalendarPageDesktop />
      </div>
      <div className="md:hidden">
        <CalendarPageMobile />
      </div>
    </>
  );
}
