import type { Route } from "./+types/home";
import MakeTree from "../maketree/maketree";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Generate an airdrop" },
    { name: "description", content: "Generate an airdrop" },
  ];
}

export default function Home() {
  return <MakeTree />;
}
