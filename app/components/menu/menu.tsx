import { NavLink, useLocation } from "react-router";
import { FaParachuteBox } from "react-icons/fa6";
import { useCgData } from "~/context/cg_data";
import { TbClockDollar } from "react-icons/tb";
import { FaHome } from "react-icons/fa";
import { RiAddLargeFill } from "react-icons/ri";

const airdropsPathRegex = /^\/airdrops(\/\d*)?$/;
const vestingsPathRegex = /^\/vestings(\/\d*)?$/;

export default function Menu() {
    const { isAdmin } = useCgData();
    const location = useLocation();

    return <nav className="flex flex-col gap-2">
        <ul className="menu bg-base-100 p-2 rounded-box self-start gap-1 ml-4 w-[calc(100%-1rem)] shadow-lg">
        <li>
                <NavLink
                    to="/"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <FaHome />
                    Home
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/vestings"
                    className={`flex flex-row items-center gap-2 ${vestingsPathRegex.test(location.pathname) ? 'bg-primary text-primary-content' : ''}`}
                >
                    <TbClockDollar />
                    Vested Claims
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/airdrops"
                    className={`flex flex-row items-center gap-2 ${airdropsPathRegex.test(location.pathname) ? 'bg-primary text-primary-content' : ''}`}
                >
                    <FaParachuteBox />
                    Unvested Claims
                </NavLink>
            </li>
        </ul>
        {isAdmin && <ul className="menu bg-base-100 p-2 rounded-box self-start gap-1 ml-4 w-[calc(100%-1rem)] shadow-lg">
            <div className="divider mt-2 mb-1 px-3 py-1.5">Admin</div>
            <li>
                <NavLink
                    to="/vestings/create"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <RiAddLargeFill />
                    Create Vested
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/airdrops/create"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <RiAddLargeFill />
                    Create Unvested
                </NavLink>
            </li>
        </ul>}
    </nav>;
}