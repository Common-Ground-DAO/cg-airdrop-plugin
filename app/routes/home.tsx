import type { Route } from "./+types/home";
import MakeTree from "../maketree/maketree";
import Menu from "~/menu/menu";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Airdrop Manager" },
    { name: "description", content: "Check your airdrop status and claim your tokens" },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <Menu />
      <MakeTree />
    </div>
  );
}
