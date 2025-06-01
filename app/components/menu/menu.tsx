import { NavLink, useLocation } from "react-router";
import { IoAddCircleOutline, IoInformationCircleOutline } from "react-icons/io5";
import { FaParachuteBox } from "react-icons/fa6";
import { useCgData } from "~/context/cg_data";

const airdropsPathRegex = /^\/\d*$/;

export default function Menu() {
    const { isAdmin } = useCgData();
    const location = useLocation();

    return (
        <ul className="menu bg-base-100 p-2 rounded-box self-start gap-1 ml-4 w-[calc(100%-1rem)] shadow-md">
            <li>
                <NavLink
                    to="/"
                    className={`flex flex-row items-center gap-2 ${airdropsPathRegex.test(location.pathname) ? 'bg-primary text-primary-content' : ''}`}
                >
                    <FaParachuteBox />
                    Airdrops
                </NavLink>
            </li>
            {isAdmin && <li>
                <NavLink
                    to="/create-airdrop"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <IoAddCircleOutline />
                    Create Airdrop
                </NavLink>
            </li>}
            <li>
                <NavLink
                    to="/about"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
                >
                    <IoInformationCircleOutline />
                    About
                </NavLink>
            </li>
        </ul>
    );
}