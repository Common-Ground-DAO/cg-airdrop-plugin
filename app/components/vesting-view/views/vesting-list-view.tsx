import { NavLink } from "react-router";
import { useCgData } from "~/context/cg_data";

export interface VestingListViewProps {
  vestingId?: number;
}

export default function VestingListView(props: VestingListViewProps) {
  const { isAdmin } = useCgData();
  
  return (
    <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
      <h1 className="text-xl font-bold p-4 pb-0">Vestings</h1>
    </div>
  );
}