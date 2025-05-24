import { NavLink } from "react-router";
import { IoAddCircleOutline } from "react-icons/io5";
import { FaParachuteBox } from "react-icons/fa6";

export default function Menu() {
    return (
        <ul className="menu bg-base-100 w-56 p-2 rounded-box self-start">
            <li>
                <NavLink to="/" className="flex flex-row items-center gap-2">
                    <FaParachuteBox />
                    Airdrops
                </NavLink>
            </li>
            <li>
                <NavLink to="/airdrop/create" className="flex flex-row items-center gap-2">
                    <IoAddCircleOutline />
                    Create Airdrop
                </NavLink>
            </li>
        </ul>
    );
}