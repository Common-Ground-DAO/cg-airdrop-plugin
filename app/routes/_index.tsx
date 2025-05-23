import { NavLink } from "react-router";
import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Airdrop Manager" },
    { name: "description", content: "Check your airdrop status and claim your tokens" },
  ];
}

export default function Index() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Airdrop Manager</h1>
      <div className="bg-base-100 rounded-lg p-6">
        <NavLink to="/airdrop/create" className="btn btn-primary">Create Airdrop</NavLink>
      </div>
    </div>
  );
}
