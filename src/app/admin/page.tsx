import { AdminPageDesktop } from "./page.desktop";
import { AdminPageMobile } from "./page.mobile";

export default function AdminPage() {
  return (
    <>
      <div className="hidden md:block">
        <AdminPageDesktop />
      </div>
      <div className="md:hidden">
        <AdminPageMobile />
      </div>
    </>
  );
}
