import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useSearchParams } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Airdrop } from "generated/prisma";
import { AirdropListView, AirdropDetailView } from "./views";

export default function AirdropView({ airdropId }: { airdropId?: number }) {
  const { communityInfo } = useCgData();
  const airdropFetcher = useFetcher<Airdrop[]>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const deletedIdsSet = useRef<Set<number>>(new Set());

  const airdrops = useMemo(() => {
    if (!airdropFetcher.data) return undefined;
    const deleted = searchParams.get("deleted");
    if (deleted) {
      searchParams.delete("deleted");
      setSearchParams(searchParams);
      if (/^\d+$/.test(deleted)) {
        const deletedId = parseInt(deleted);
        deletedIdsSet.current.add(deletedId);
      }
      else {
        console.warn("Invalid deleted ID: " + deleted);
      }
    }
    return airdropFetcher.data.filter(a => !deletedIdsSet.current.has(a.id));
  }, [airdropFetcher.data, searchParams, deletedIdsSet]);

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
    if (!airdrops || airdropId === undefined) return null;
    return airdrops.find(a => a.id === airdropId);
  }, [airdrops, airdropId]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100%-1rem)]">
      {!airdrop && <AirdropListView airdrops={airdrops} />}
      {!!airdrop && <AirdropDetailView airdrop={airdrop} />}
    </div>
  );
}