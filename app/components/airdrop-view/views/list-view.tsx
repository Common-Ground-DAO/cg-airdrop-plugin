import { NavLink } from "react-router";
import type { Airdrop } from "generated/prisma";
import { IoChevronForward } from "react-icons/io5";
import { useCgData } from "~/context/cg_data";

export default function AirdropListView({
  airdrops,
}: {
  airdrops?: Airdrop[],
}) {
  const { isAdmin } = useCgData();

  return (
    <div className="flex-1 card px-6 py-4 bg-base-100 mr-4 overflow-auto shadow-lg">
      <div className="flex flex-col gap-4 flex-1 items-center">
        <h1 className="text-3xl font-bold mb-2">Airdrops</h1>
        <div className="flex flex-col gap-4 w-full flex-1">
          {!!airdrops && airdrops.length > 0 && airdrops.map((airdrop) => (
            <NavLink
              key={airdrop.id}
              to={`/${airdrop.id}`}
              className="card card-sm bg-base-300 px-3 py-2 w-full cursor-pointer flex flex-row gap-4 items-center"
            >
              <div className="flex flex-row gap-2 items-center">
                <h2 className="text-lg font-bold">{airdrop.name}</h2>
                <p className="text-xs text-gray-500">on {airdrop.chainName}</p>
              </div>
              <IoChevronForward className="ml-auto" />
            </NavLink>
          ))}
        </div>
        {!!airdrops && airdrops.length === 0 && <div>No airdrops found for this community :(</div>}
        {!airdrops && <div>Loading...</div>}
      </div>
    </div>
  );
}