import { DashboardPageDesktop } from "./page.desktop";
import { DashboardPageMobile } from "./page.mobile";

export default function DashboardPage() {
  return (
    <>
      <div className="hidden md:block">
        <DashboardPageDesktop />
      </div>
      <div className="md:hidden">
        <DashboardPageMobile />
      </div>
    </>
  );
}
