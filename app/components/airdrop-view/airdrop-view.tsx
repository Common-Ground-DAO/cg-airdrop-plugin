import { useEffect, useMemo, useState } from "react";
import { NavLink, useFetcher } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Airdrop, AirdropItem } from "generated/prisma";
import { IoArrowBack, IoChevronForward } from "react-icons/io5";
import FormatUnits from "../format-units/format-units";
import { useErc20Abi } from "~/hooks/contractFactories";
import { useReadContract } from "wagmi";

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
    <div className="flex flex-col max-h-[calc(100%-1rem)]">
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
    <div className="card px-8 py-4 bg-base-100 overflow-auto">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-3xl font-bold mb-2">Airdrops</h1>
        {!!airdrops && airdrops.length > 0 && airdrops.map((airdrop) => (
          <NavLink
            key={airdrop.id}
            to={`/${airdrop.id}`}
            className="card card-sm bg-base-300 px-3 py-2 w-full cursor-pointer flex flex-row gap-4 items-center"
          >
            <div className="flex flex-row gap-2 items-center">
              <h2 className="text-lg font-bold">{airdrop.name}</h2>
              <p className="text-xs text-gray-500">on {airdrop.chainName}</p>
            </div>
            <IoChevronForward className="ml-auto" />
          </NavLink>
        ))}
        {!!airdrops && airdrops.length === 0 && <div>No airdrops found for this community :(</div>}
        {!airdrops && <div>Loading...</div>}
      </div>
    </div>
  );
}

function AirdropDetailView({
  airdrop,
}: {
  airdrop: Airdrop,
}) {
  const airdropItemsFetcher = useFetcher<AirdropItem[]>();
  const erc20Abi = useErc20Abi();

  const { data: decimals } = useReadContract({
    address: airdrop.erc20Address as `0x${string}`,
    abi: erc20Abi || [],
    functionName: "decimals",
    chainId: airdrop.chainId,
  });

  useEffect(() => {
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/items` });
  }, [airdrop]);

  const airdropItems = airdropItemsFetcher.data;

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
        {airdropItems && airdropItems.length > 0 && decimals !== undefined && <table>
          <tbody>
            <tr>
              <th className="p-2 border-b">Address</th>
              <th className="p-2 border-b">Amount</th>
            </tr>
            {airdropItems.map((item, index) => (
              <tr key={item.address}>
                <td className={`p-2 ${index === airdropItems.length - 1 ? "" : "border-b"}`}>
                  {item.address}
                </td>
                <td className={`p-2 ${index === airdropItems.length - 1 ? "" : "border-b"}`}>
                  <FormatUnits value={item.amount} decimals={decimals || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
        {(!airdropItems || decimals === undefined) && <div>Loading...</div>}
        {airdropItems && airdropItems.length === 0 && <div>No airdrop items found for this airdrop :(</div>}
      </div>
    </div>
  );
}