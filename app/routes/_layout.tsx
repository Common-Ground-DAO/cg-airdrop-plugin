import { Outlet } from "react-router";
import Header from "~/components/header/header";

export default function Layout() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <Outlet />
    </div>
  );
} 