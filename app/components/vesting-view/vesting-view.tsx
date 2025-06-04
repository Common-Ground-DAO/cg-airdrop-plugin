import { useCgData } from "~/context/cg_data";
import VestingListView from "./views/list-view";
import VestingDetailView from "./views/detail-view";

export default function VestingView({ vestingId }: { vestingId?: number }) {
  const { communityInfo } = useCgData();

  return (
    <div className="flex flex-col h-full max-h-[calc(100%-1rem)]">
      <VestingListView vestingId={vestingId} />
    </div>
  );
}