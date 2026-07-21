import { SettingsPageDesktop } from "./page.desktop";
import { SettingsPageMobile } from "./page.mobile";

export default function SettingsPage() {
  return (
    <>
      <div className="hidden md:block">
        <SettingsPageDesktop />
      </div>
      <div className="md:hidden">
        <SettingsPageMobile />
      </div>
    </>
  );
}
