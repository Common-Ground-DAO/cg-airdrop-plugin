import VestingCreate from "../components/vesting-create/vesting-create";

export function meta() {
  return [
    { title: "Create new Vesting" },
    { name: "description", content: "Create a new vesting contract and deploy it to the blockchain" },
  ];
}

export default function CreateVesting() {
  return <VestingCreate />;
} 