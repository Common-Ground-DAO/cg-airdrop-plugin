import { NavLink } from "react-router";
import { useCgData } from "~/context/cg_data";

export interface VestingDetailViewProps {

}

export default function VestingDetailView(props: VestingDetailViewProps) {
  const { isAdmin } = useCgData();
  
  return (
    <div className="flex-1 card px-6 py-4 bg-base-100 mr-4 overflow-auto shadow-lg">
      <div className="flex flex-col gap-4 flex-1 items-center">
        <h1 className="text-3xl font-bold mb-2">Vestings</h1>
        <div className="flex flex-row gap-2 items-end mt-auto">
          {isAdmin && <NavLink to="/create-vesting" className="btn btn-primary">Admin: Create Vesting</NavLink>}
        </div>
      </div>
    </div>
  );
}