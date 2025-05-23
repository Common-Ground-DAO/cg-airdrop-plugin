import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Airdrop Manager" },
    { name: "description", content: "Check your airdrop status and claim your tokens" },
  ];
}

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Airdrop Manager</h1>
      <div className="bg-base-100 rounded-lg p-6">
        <p className="mb-4">Manage your airdrops efficiently with our tools.</p>
        <div className="space-y-2">
          <a href="/airdrops/list" className="btn btn-primary block">
            View Airdrops List
          </a>
          <a href="/airdrops/create" className="btn btn-secondary block">
            Create New Airdrop
          </a>
        </div>
      </div>
    </div>
  );
}
