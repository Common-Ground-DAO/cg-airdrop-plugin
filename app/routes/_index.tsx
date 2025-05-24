import { useParams } from "react-router";
import type { Route } from "./+types/_index";
import AirdropView from "~/components/airdrop-view/airdrop-view";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Airdrop Manager" },
    { name: "description", content: "Check your airdrop status and claim your tokens" },
  ];
}

export default function Index() {
  const { airdropId } = useParams();
  let airdropIdNumber: number | undefined;
  try {
    airdropIdNumber = airdropId ? parseInt(airdropId) : undefined;
  } catch (error) {
    console.error("Invalid airdropId", error);
  }

  return (
    <AirdropView airdropId={airdropIdNumber} />
  );
}
