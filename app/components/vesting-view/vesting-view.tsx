import { useCgData } from "~/context/cg_data";
import { VestingListView, VestingDetailView } from "./views";
import { useFetcher, useSubmit } from "react-router";
import type { Vesting } from "generated/prisma";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function VestingView({ vestingId }: { vestingId?: number }) {
  const { communityInfo, __userInfoRawResponse, __communityInfoRawResponse } = useCgData();
  const vestingFetcher = useFetcher<Vesting[]>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deletedIdsSet, setDeletedIdsSet] = useState<Set<number>>(new Set());
  const submit = useSubmit();
  const [deleteIsSubmitting, setDeleteIsSubmitting] = useState(false);

  const vestings = useMemo(() => {
    if (!vestingFetcher.data) return undefined;
    return vestingFetcher.data.filter(a => !deletedIdsSet.has(a.id));
  }, [vestingFetcher.data, deletedIdsSet]);

  useEffect(() => {
    if (!communityInfo) return;
    vestingFetcher.submit(
      { communityId: communityInfo.id },
      { method: "post", action: `/api/vesting/list` }
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

  const vesting = useMemo(() => {
    if (!vestings || vestingId === undefined) return null;
    return vestings.find(a => a.id === vestingId);
  }, [vestings, vestingId]);

  const deleteVesting = useCallback(async (vestingId: number) => {
    const newDeletedIdsSet = new Set(deletedIdsSet);
    try {
      setDeleteIsSubmitting(true);
      const formData = new FormData();
      formData.append("vestingId", vestingId.toString());
      formData.append("communityInfoRaw", __communityInfoRawResponse || "");
      formData.append("userInfoRaw", __userInfoRawResponse || "");
      await submit(formData, { method: "post", action: `/api/vesting/delete`, navigate: false });
      newDeletedIdsSet.add(vestingId);
      setDeletedIdsSet(newDeletedIdsSet);
    }
    catch (error) {
      console.error("Error deleting vesting: " + error);
    }
    finally {
      setDeleteIsSubmitting(false);
    }
  }, [submit, __userInfoRawResponse, __communityInfoRawResponse, deletedIdsSet]);

  if (vesting) {
    return <VestingDetailView vesting={vesting} deleteVesting={deleteVesting} deleteIsSubmitting={deleteIsSubmitting} />;
  }

  return <VestingListView vestings={vestings} />;
}