import { Outlet } from "react-router";
import Header from "~/components/header/header";
import Menu from "~/components/menu/menu";

export default function Layout() {
  return (
    <div className="grid grid-cols-[100vw] grid-rows-[72px_calc(100vh-72px)] h-[100vh] w-[100vw] max-h-[100vh] max-w-[100vw] overflow-hidden">
      <Header />
      <div className="grid grid-cols-[225px_calc(100vw-241px)] grid-rows-[100%] gap-4 overflow-hidden">
        <Menu />
        <div className="card bg-base-100 shadow-lg h-[calc(100%-1rem)] max-h-[calc(100%-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] mr-4 mb-4">
          <div className="flex flex-col flex-1 h-full max-h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
} 