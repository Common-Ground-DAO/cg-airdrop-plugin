import { useParams } from "react-router";
import type { Route } from "./+types/vestings";
import VestingView from "~/components/vesting-view/vesting-view";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vesting Manager" },
    { name: "description", content: "Check your vesting status and claim your tokens" },
  ];
}

export default function Vestings() {
  const { vestingId } = useParams();
  let vestingIdNumber: number | undefined;
  try {
    vestingIdNumber = vestingId ? parseInt(vestingId) : undefined;
  } catch (error) {
    console.error("Invalid vestingId", error);
  }

  return (
    <VestingView vestingId={vestingIdNumber} />
  );
}
