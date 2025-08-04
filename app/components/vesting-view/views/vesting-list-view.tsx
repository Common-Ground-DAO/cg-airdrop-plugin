import type { Vesting } from "generated/prisma";
import { IoChevronForward } from "react-icons/io5";
import { NavLink } from "react-router";
import { useGetChainNameById } from "~/hooks/contracts";

export interface VestingListViewProps {
  vestings?: Vesting[];
}

export default function VestingListView({ vestings }: VestingListViewProps) {
  const getChainNameById = useGetChainNameById();

  return (
    <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
      <h1 className="text-xl font-bold p-4 pb-0">Vestings</h1>
      {!!vestings && vestings.length > 0 && <div className="flex flex-col gap-4 w-full max-w-full flex-1 overflow-auto">
        {vestings.map((vesting) => (
          <NavLink
            key={vesting.id}
            to={`/vestings/${vesting.id}`}
            className="card card-sm flex-row bg-base-300 pl-4 pr-3 py-2 ml-4 w-full max-w-[calc(100%-2rem)] cursor-pointer gap-4 items-center"
          >
            <div className="flex flex-row flex-1 gap-2 items-center justify-between">
              <h2 className="text-lg font-bold">{vesting.name}</h2>
              <div className="badge badge-xs badge-primary">{getChainNameById(vesting.chainId)}</div>
            </div>
            <IoChevronForward className="ml-auto" />
          </NavLink>
        ))}
      </div>}
      {!!vestings && vestings.length === 0 && <div className="flex flex-col items-center justify-center w-full">No vestings found for this community :(</div>}
      {!vestings && <div className="flex flex-col items-center justify-center w-full">Loading...</div>}
    </div>
  );
}