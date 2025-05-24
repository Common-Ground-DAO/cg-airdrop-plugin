import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Airdrop, AirdropItem } from "generated/prisma";
import { IoArrowBack, IoChevronForward } from "react-icons/io5";

export default function AirdropView() {
  const { communityInfo } = useCgData();
  const airdropFetcher = useFetcher<Airdrop[]>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [airdropId, setAirdropId] = useState<number | null>(null);

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
    }, 5_000);
    return () => clearInterval(interval);
  }, []);

  const airdrop = useMemo(() => {
    if (!airdropFetcher.data || airdropId === null) return null;
    return airdropFetcher.data.find(a => a.id === airdropId);
  }, [airdropFetcher.data, airdropId]);

  return (
    <div className="px-8 pb-4">
      {!airdrop && <AirdropList
        airdrops={airdropFetcher.data}
        setAirdropId={setAirdropId}
      />}
      {!!airdrop && <AirdropDetailView
        airdrop={airdrop}
        setAirdropId={setAirdropId}
      />}
    </div>
  );
}

function AirdropList({
  airdrops,
  setAirdropId,
}: {
  airdrops?: Airdrop[],
  setAirdropId: (id: number | null) => void,
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold mb-6">Airdrops</h1>
      {!!airdrops && airdrops.map((airdrop) => (
        <div
          key={airdrop.id}
          onClick={() => setAirdropId(airdrop.id)}
          className="card bg-base-100 w-full p-4 cursor-pointer flex flex-row gap-4 items-center"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">{airdrop.name}</h2>
          </div>
          <IoChevronForward className="ml-auto" />
        </div>
      ))}
      {!airdrops && <div>Loading...</div>}
    </div>
  );
}

function AirdropDetailView({
  airdrop,
  setAirdropId,
}: {
  airdrop: Airdrop,
  setAirdropId: (id: number | null) => void,
}) {
  const airdropItemsFetcher = useFetcher<AirdropItem[]>();

  useEffect(() => {
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/items` });
  }, [airdrop]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 items-center">
        <button onClick={() => setAirdropId(null)} className="btn btn-ghost btn-circle">
          <IoArrowBack className="w-4 h-4" />
        </button>
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
      </div>
    </div>
  );
}