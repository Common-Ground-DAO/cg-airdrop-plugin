import { Outlet } from "react-router";
import Header from "~/components/header/header";
import Menu from "~/components/menu/menu";
import { useWindowSize } from "~/context/window_size";

export default function Layout() {
  const { isMobile } = useWindowSize();

  if (isMobile) {
    return <div className="h-full max-h-full w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-[100vw] h-full max-h-full grid-rows-[auto_1fr] overflow-hidden">
        <Header />
        <div className="drawer grid grid-rows-[100%] h-full overflow-hidden">
          <input id="my-drawer" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content grid grid-cols-[100%] grid-rows-[100%] h-full">
            <label
              htmlFor="my-drawer" className="btn btn-circle drawer-button btn-primary absolute bottom-4 left-4 z-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>

            <div className="overflow-y-auto h-full px-4 pb-12">
              <div className="card bg-base-100 shadow-lg pb-4">
                <div className="flex flex-col">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
          <div className="drawer-side">
            <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
            <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
              <Menu />
            </ul>
          </div>
        </div>
      </div>
    </div>;
  }

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