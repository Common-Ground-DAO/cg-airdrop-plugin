import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Airdrop } from "generated/prisma";
import { AirdropListView, AirdropDetailView } from "./views";

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
      {!airdrop && <AirdropListView airdrops={airdropFetcher.data} />}
      {!!airdrop && <AirdropDetailView airdrop={airdrop} />}
    </div>
  );
}