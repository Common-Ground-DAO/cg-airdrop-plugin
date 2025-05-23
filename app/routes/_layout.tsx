import { Outlet } from "react-router";
import Menu from "~/menu/menu";

export default function Layout() {
  return (
    <div className="flex flex-col h-full">
      <Menu />
      <Outlet />
    </div>
  );
} 