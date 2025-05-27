import { useCallback, useEffect, useMemo } from "react";
import { NavLink, useFetcher, useNavigate, useSubmit } from "react-router";
import type { Airdrop, AirdropItem } from "generated/prisma";
import { IoArrowBack } from "react-icons/io5";
import FormatUnits from "../../format-units/format-units";
import { useCgData } from "~/context/cg_data";
import { useErc20Data } from "~/hooks";
import { useAccount } from "wagmi";

export default function AirdropDetailView({
  airdrop,
}: {
  airdrop: Airdrop,
}) {
  const airdropItemsFetcher = useFetcher<AirdropItem[]>();
  const submit = useSubmit();
  const { isAdmin, __userInfoRawResponse, __communityInfoRawResponse } = useCgData();
  const { decimals, error: contractLoadError } = useErc20Data(airdrop.erc20Address as `0x${string}`, airdrop.chainId);
  const { address } = useAccount();

  useEffect(() => {
    if (airdrop?.id === undefined) return;
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/items` });
  }, [airdrop?.id]);

  const deleteAirdrop = useCallback(() => {
    const formData = new FormData();
    formData.append("airdropId", airdrop.id.toString());
    formData.append("communityInfoRaw", __communityInfoRawResponse || "");
    formData.append("userInfoRaw", __userInfoRawResponse || "");
    // Todo: add confirmation modal
    // Todo: refresh airdrop list
    submit(formData, { method: "post", action: `/api/airdrop/delete`, navigate: false });
  }, [airdrop, submit, __userInfoRawResponse, __communityInfoRawResponse]);

  const { ownAirdropItems, otherAirdropItems } = useMemo(() => {
    const lowerCaseAddress = address?.toLowerCase();
    if (!lowerCaseAddress) return { ownAirdropItems: [], otherAirdropItems: airdropItemsFetcher.data || [] };
    let ownAirdropItems: AirdropItem[] = [];
    const otherAirdropItems: AirdropItem[] = [];
    for (const item of airdropItemsFetcher.data || []) {
      if (item.address.toLowerCase() === lowerCaseAddress) {
        if (ownAirdropItems.length > 0) {
          console.warn("Multiple airdrop items found for the same address: ", item.address);
        }
        ownAirdropItems.push(item);
      } else {
        otherAirdropItems.push(item);
      }
    }
    return { ownAirdropItems, otherAirdropItems };
  }, [airdropItemsFetcher.data, address]);

  const hasItems = ownAirdropItems.length > 0 || otherAirdropItems.length > 0;

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
          {hasItems && decimals !== undefined && <table>
            <tbody>
              <tr>
                <th className="p-2 border-b">Address</th>
                <th className="p-2 border-b">Amount</th>
                <th className="p-2 border-b">{ownAirdropItems.length > 0 ? "Claim" : ""}</th>
              </tr>
              {ownAirdropItems.map((item, index) => (
                <tr key={item.address}>
                  <td className={`p-2 font-mono ${index === ownAirdropItems.length - 1 && otherAirdropItems.length === 0 ? "" : "border-b border-inherit"}`}>
                    <span className="text-success">{item.address}</span>
                  </td>
                  <td className={`p-2 ${index === ownAirdropItems.length - 1 && otherAirdropItems.length === 0 ? "" : "border-b"}`}>
                    <FormatUnits className="text-right text-success" value={item.amount} decimals={decimals || 0} />
                  </td>
                  <td className={`${index === ownAirdropItems.length - 1 && otherAirdropItems.length === 0 ? "" : "border-b"}`}>
                    <div className="flex flex-col items-center">
                      <button className="btn btn-xs btn-primary">Claim</button>
                    </div>
                  </td>
                </tr>
              ))}
              {otherAirdropItems.map((item, index) => (
                <tr key={item.address}>
                  <td className={`p-2 font-mono ${index === otherAirdropItems.length - 1 ? "" : "border-b"}`}>
                    {item.address}
                  </td>
                  <td className={`p-2 ${index === otherAirdropItems.length - 1 ? "" : "border-b"}`}>
                    <FormatUnits className="text-right" value={item.amount} decimals={decimals || 0} />
                  </td>
                  <td className={`p-2 ${index === otherAirdropItems.length - 1 ? "" : "border-b"}`}></td>
                </tr>
              ))}
            </tbody>
          </table>}
          {!airdropItemsFetcher.data ? <div>Loading items...</div> : decimals === undefined ? <div>Loading contract data...</div> : null}
          {airdropItemsFetcher.data?.length === 0 && <div>No airdrop items found for this airdrop :(</div>}
          {contractLoadError && <div>Error: {contractLoadError.message}</div>}
        </div>
      </div>
      {isAdmin && <div className="flex flex-row gap-4 w-full items-center justify-center mt-4">
        <span className="text-xs">Admin Actions</span>
        <button className="btn btn-error btn-sm" onClick={() => (document.getElementById("delete-airdrop-modal") as any)?.showModal()}>Delete Airdrop</button>
      </div>}
      {isAdmin && <dialog id="delete-airdrop-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Are you sure you want to delete this airdrop?</h3>
          <p className="py-4">This action cannot be undone.</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-outline">Cancel</button>
            </form>
            <button className="btn btn-error" onClick={deleteAirdrop}>Delete</button>
          </div>
        </div>
      </dialog>}
    </div>
  );
}