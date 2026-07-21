import { BoardPageDesktop } from "./page.desktop";
import { BoardPageMobile } from "./page.mobile";

export default function BoardPage() {
  return (
    <>
      <div className="hidden md:block">
        <BoardPageDesktop />
      </div>
      <div className="md:hidden">
        <BoardPageMobile />
      </div>
    </>
  );
}
