export function meta() {
  return [
    { title: "Airdrops List - Airdrop Manager" },
    { name: "description", content: "View all available airdrops" },
  ];
}

export default function AirdropsList() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Airdrops List</h1>
      <div className="bg-base-100 rounded-lg p-6">
        <p>This will show your list of airdrops.</p>
      </div>
    </div>
  );
} 