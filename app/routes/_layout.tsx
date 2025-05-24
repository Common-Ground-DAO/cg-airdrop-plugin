import { Outlet } from "react-router";
import Header from "~/components/header/header";
import Menu from "~/components/menu/menu";

export default function Layout() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex flex-row h-full px-4 py-2">
        <Menu />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
} 