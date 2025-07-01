import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useSearchParams, useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Airdrop } from "generated/prisma";
import { AirdropListView, AirdropDetailView } from "./views";

export default function AirdropView({ airdropId }: { airdropId?: number }) {
  const { communityInfo, __userInfoRawResponse, __communityInfoRawResponse } = useCgData();
  const airdropFetcher = useFetcher<Airdrop[]>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deletedIdsSet, setDeletedIdsSet] = useState<Set<number>>(new Set());
  const submit = useSubmit();
  const [deleteIsSubmitting, setDeleteIsSubmitting] = useState(false);

  const airdrops = useMemo(() => {
    if (!airdropFetcher.data) return undefined;
    return airdropFetcher.data.filter(a => !deletedIdsSet.has(a.id));
  }, [airdropFetcher.data, deletedIdsSet]);

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

  const deleteAirdrop = useCallback(async (airdropId: number) => {
    const newDeletedIdsSet = new Set(deletedIdsSet);
    try {
      setDeleteIsSubmitting(true);
      const formData = new FormData();
      formData.append("airdropId", airdropId.toString());
      formData.append("communityInfoRaw", __communityInfoRawResponse || "");
      formData.append("userInfoRaw", __userInfoRawResponse || "");
      await submit(formData, { method: "post", action: `/api/airdrop/delete`, navigate: false });
      newDeletedIdsSet.add(airdropId);
      setDeletedIdsSet(newDeletedIdsSet);
    }
    catch (error) {
      console.error("Error deleting airdrop: " + error);
    }
    finally {
      setDeleteIsSubmitting(false);
    }
  }, [submit, __userInfoRawResponse, __communityInfoRawResponse, deletedIdsSet]);

  if (airdrop) {
    return <AirdropDetailView airdrop={airdrop} deleteAirdrop={deleteAirdrop} deleteIsSubmitting={deleteIsSubmitting} />;
  }

  return <AirdropListView airdrops={airdrops} />;
}