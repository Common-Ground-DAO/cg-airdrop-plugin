import { NavLink } from "react-router";
import { useCgData } from "~/context/cg_data";

export interface VestingListViewProps {
  vestingId?: number;
}

export default function VestingListView(props: VestingListViewProps) {
  const { isAdmin } = useCgData();
  
  return (
    <div className="flex-1 card px-6 py-4 bg-base-100 mr-4 overflow-auto shadow-lg">
      <div className="flex flex-col gap-4 flex-1 items-center">
        <h1 className="text-3xl font-bold mb-2">Vestings</h1>
      </div>
    </div>
  );
}