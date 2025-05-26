import { Outlet } from "react-router";
import Header from "~/components/header/header";
import Menu from "~/components/menu/menu";

export default function Layout() {
  return (
    <div className="grid grid-rows-[72px_1fr] h-full w-full max-h-[100vh] max-w-[100vw]">
      <Header />
      <div className="grid grid-cols-[auto_1fr] px-4 py-2 gap-4 max-h-full overflow-hidden">
        <Menu />
        <div className="overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
} 