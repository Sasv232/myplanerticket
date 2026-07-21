import { FitnessPageDesktop } from "./page.desktop";
import { FitnessPageMobile } from "./page.mobile";

export default function FitnessPage() {
  return (
    <>
      <div className="hidden md:block">
        <FitnessPageDesktop />
      </div>
      <div className="md:hidden">
        <FitnessPageMobile />
      </div>
    </>
  );
}
