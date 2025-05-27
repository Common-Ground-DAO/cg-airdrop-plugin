import { useCallback, useEffect } from "react";
import { NavLink, useFetcher, useSubmit } from "react-router";
import type { Airdrop, AirdropItem } from "generated/prisma";
import { IoArrowBack } from "react-icons/io5";
import FormatUnits from "../../format-units/format-units";
import { useErc20Abi } from "~/hooks/contractFactories";
import { useReadContract } from "wagmi";
import { useCgData } from "~/context/cg_data";

export default function AirdropDetailView({
  airdrop,
}: {
  airdrop: Airdrop,
}) {
  const airdropItemsFetcher = useFetcher<AirdropItem[]>();
  const erc20Abi = useErc20Abi();
  const submit = useSubmit();
  const { isAdmin, __userInfoRawResponse, __communityInfoRawResponse } = useCgData();

  const { data: decimals } = useReadContract({
    address: airdrop.erc20Address as `0x${string}`,
    abi: erc20Abi || [],
    functionName: "decimals",
    chainId: airdrop.chainId,
  });

  useEffect(() => {
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/items` });
  }, [airdrop]);

  const deleteAirdrop = useCallback(() => {
    const formData = new FormData();
    formData.append("airdropId", airdrop.id.toString());
    formData.append("communityInfoRaw", __communityInfoRawResponse || "");
    formData.append("userInfoRaw", __userInfoRawResponse || "");
    submit(formData, { method: "post", action: `/api/airdrop/delete`, navigate: false });
  }, [airdrop, submit, __userInfoRawResponse, __communityInfoRawResponse]);

  const airdropItems = airdropItemsFetcher.data;

  return (
    <div className="card bg-base-100 overflow-hidden p-4">
      <div className="flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-row gap-1 items-center">
          <NavLink to="/" className="btn btn-ghost btn-circle">
            <IoArrowBack className="w-4 h-4" />
          </NavLink>
          <h1 className="text-3xl font-bold">{airdrop.name}</h1>
        </div>
        <div className="flex flex-col flex-1 gap-4 overflow-auto">
          {airdropItems && airdropItems.length > 0 && decimals !== undefined && <table>
            <tbody>
              <tr>
                <th className="p-2 border-b">Address</th>
                <th className="p-2 border-b">Amount</th>
              </tr>
              {airdropItems.map((item, index) => (
                <tr key={item.address}>
                  <td className={`p-2 ${index === airdropItems.length - 1 ? "" : "border-b"}`}>
                    {item.address}
                  </td>
                  <td className={`p-2 ${index === airdropItems.length - 1 ? "" : "border-b"}`}>
                    <FormatUnits value={item.amount} decimals={decimals || 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
          {(!airdropItems || decimals === undefined) && <div>Loading...</div>}
          {airdropItems && airdropItems.length === 0 && <div>No airdrop items found for this airdrop :(</div>}
        </div>
      </div>
      <div className="flex flex-row gap-4">
        {isAdmin && <button className="btn btn-error" onClick={deleteAirdrop}>Delete Airdrop</button>}
      </div>
    </div>
  );
}