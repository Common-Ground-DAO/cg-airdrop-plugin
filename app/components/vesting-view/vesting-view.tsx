import { useCgData } from "~/context/cg_data";
import VestingListView from "./views/list-view";
import VestingDetailView from "./views/detail-view";

export default function VestingView({ vestingId }: { vestingId?: number }) {
  const { communityInfo } = useCgData();

  return (
    <VestingListView vestingId={vestingId} />
  );
}