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

    return <div className="flex flex-col gap-2">
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
                    to="/airdrops"
                    className={`flex flex-row items-center gap-2 ${airdropsPathRegex.test(location.pathname) ? 'bg-primary text-primary-content' : ''}`}
                >
                    <FaParachuteBox />
                    Airdrops
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/vestings"
                    className={`flex flex-row items-center gap-2 ${vestingsPathRegex.test(location.pathname) ? 'bg-primary text-primary-content' : ''}`}
                >
                    <TbClockDollar />
                    Vestings
                </NavLink>
            </li>
        </ul>
        {isAdmin && <ul className="menu bg-base-100 p-2 rounded-box self-start gap-1 ml-4 w-[calc(100%-1rem)] shadow-lg">
            <li><div className="divider mt-2 mb-1">Admin</div></li>
            <li>
                <NavLink
                    to="/create-airdrop"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <RiAddLargeFill />
                    New Airdrop
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/create-vesting"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <RiAddLargeFill />
                    New Vesting
                </NavLink>
            </li>
        </ul>}
    </div>;
}