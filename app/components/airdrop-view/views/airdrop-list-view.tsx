import { NavLink } from "react-router";
import type { Airdrop } from "generated/prisma";
import { IoChevronForward } from "react-icons/io5";
import { useGetChainNameById } from "~/hooks/contracts";

export default function AirdropListView({
  airdrops,
}: {
  airdrops?: Airdrop[],
}) {
  const getChainNameById = useGetChainNameById();

  return (
    <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
      <h1 className="text-xl font-bold p-4 pb-0">Unvested Claims</h1>
      {!!airdrops && airdrops.length > 0 && <div className="flex flex-col gap-4 w-full max-w-full flex-1 overflow-auto">
        {airdrops.map((airdrop) => (
          <NavLink
            key={airdrop.id}
            to={`/airdrops/${airdrop.id}`}
            className="card card-sm flex-row bg-base-300 pl-4 pr-3 py-2 ml-4 w-full max-w-[calc(100%-2rem)] cursor-pointer gap-4 items-center"
          >
            <div className="flex flex-row flex-1 gap-2 items-center justify-between">
              <h2 className="text-lg font-bold">{airdrop.name}</h2>
              <div className="badge badge-xs badge-primary">{getChainNameById(airdrop.chainId)}</div>
            </div>
            <IoChevronForward className="ml-auto" />
          </NavLink>
        ))}
      </div>}
      {!!airdrops && airdrops.length === 0 && <div className="flex flex-col items-center justify-center w-full">No unvested claims found for this community :(</div>}
      {!airdrops && <div className="flex flex-col items-center justify-center w-full">Loading...</div>}
    </div>
  );
}