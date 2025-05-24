import { NavLink } from "react-router";
import { IoAddCircleOutline, IoInformationCircleOutline } from "react-icons/io5";
import { FaParachuteBox } from "react-icons/fa6";
import { useCgData } from "~/context/cg_data";

export default function Menu() {
    const { isAdmin } = useCgData();

    return (
        <ul className="menu bg-base-100 w-56 p-2 rounded-box self-start">
            <li>
                <NavLink
                    to="/"
                    className={({ isActive }) => isActive ? "flex flex-row items-center gap-2 bg-primary text-primary-content" : "flex flex-row items-center gap-2"}
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