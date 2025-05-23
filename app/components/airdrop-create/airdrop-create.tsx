import { NavLink } from "react-router";


export default function AirdropView() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-full">
        <NavLink to="/" className="link link-neutral">Back</NavLink>
        <h1>Airdrop List</h1>
      </div>
    </div>
  );
}