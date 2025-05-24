import { useEffect, useMemo, useState } from "react";
import { NavLink, useFetcher } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Airdrop, AirdropItem } from "generated/prisma";
import { IoArrowBack, IoChevronForward } from "react-icons/io5";

export default function AirdropView({ airdropId }: { airdropId?: number }) {
  const { communityInfo } = useCgData();
  const airdropFetcher = useFetcher<Airdrop[]>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!communityInfo) return;
    airdropFetcher.submit(
      { communityId: communityInfo.id },
      { method: "post", action: `/api/airdrop/list` }
    );
  }, [communityInfo?.id, refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(i => i + 1);
      if (!import.meta.env.VITE_AIRDROP_REFRESH_INTERVAL) {
        console.warn("VITE_AIRDROP_REFRESH_INTERVAL is not set, using default of 60000ms");
      }
    }, parseInt(import.meta.env.VITE_AIRDROP_REFRESH_INTERVAL || "60000"));
    return () => clearInterval(interval);
  }, []);

  const airdrop = useMemo(() => {
    if (!airdropFetcher.data || airdropId === undefined) return null;
    return airdropFetcher.data.find(a => a.id === airdropId);
  }, [airdropFetcher.data, airdropId]);

  return (
    <div className="px-8 pb-4">
      {!airdrop && <AirdropList airdrops={airdropFetcher.data} />}
      {!!airdrop && <AirdropDetailView airdrop={airdrop} />}
    </div>
  );
}

function AirdropList({
  airdrops,
}: {
  airdrops?: Airdrop[],
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold mb-6">Airdrops</h1>
      {!!airdrops && airdrops.length > 0 && airdrops.map((airdrop) => (
        <NavLink
          key={airdrop.id}
          to={`/${airdrop.id}`}
          className="card bg-base-100 w-full p-4 cursor-pointer flex flex-row gap-4 items-center"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">{airdrop.name}</h2>
          </div>
          <IoChevronForward className="ml-auto" />
        </NavLink>
      ))}
      {!!airdrops && airdrops.length === 0 && <div>No airdrops found for this community :(</div>}
      {!airdrops && <div>Loading...</div>}
    </div>
  );
}

function AirdropDetailView({
  airdrop,
}: {
  airdrop: Airdrop,
}) {
  const airdropItemsFetcher = useFetcher<AirdropItem[]>();

  useEffect(() => {
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/items` });
  }, [airdrop]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-1 items-center">
        <NavLink to="/" className="btn btn-ghost btn-circle">
          <IoArrowBack className="w-4 h-4" />
        </NavLink>
        <h1 className="text-3xl font-bold">{airdrop.name}</h1>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <h2>Airdrop Items</h2>
        </div>
        {!!airdropItemsFetcher.data && <table>
          <tbody>
            <tr>
              <th>Address</th>
              <th>Amount</th>
            </tr>
            {airdropItemsFetcher.data.map((item) => (
              <tr key={item.address}>
                <td>{item.address}</td>
                <td>{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>}
        {!airdropItemsFetcher.data && <div>Loading...</div>}
        {airdropItemsFetcher.data && airdropItemsFetcher.data.length === 0 && <div>No airdrop items found for this airdrop :(</div>}
      </div>
    </div>
  );
}