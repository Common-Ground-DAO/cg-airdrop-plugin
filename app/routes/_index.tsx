import type { Route } from "./+types/_index";
import AirdropView from "~/components/airdrop-view/airdrop-view";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Airdrop Manager" },
    { name: "description", content: "Check your airdrop status and claim your tokens" },
  ];
}

export default function Index() {
  return (
    <div className="px-8 pb-4">
      <AirdropView />
    </div>
  );
}
