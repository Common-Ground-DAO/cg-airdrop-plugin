import AirdropDetailView from "../components/airdrop-view/airdrop-view";

export function meta() {
  return [
    { title: "View airdrop" },
    { name: "description", content: "View an airdrop and claim your tokens" },
  ];
}

export default function AirdropView() {
  return <AirdropDetailView />;
} 