import MakeTree from "../maketree/maketree";

export function meta() {
  return [
    { title: "Create Airdrop - Airdrop Manager" },
    { name: "description", content: "Create a new airdrop merkle tree" },
  ];
}

export default function Create() {
  return <MakeTree />;
} 