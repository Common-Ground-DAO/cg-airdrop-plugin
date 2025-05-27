import { useCallback, useEffect } from "react";
import { NavLink, useFetcher, useNavigate, useSubmit } from "react-router";
import type { Airdrop, AirdropItem } from "generated/prisma";
import { IoArrowBack } from "react-icons/io5";
import FormatUnits from "../../format-units/format-units";
import { useCgData } from "~/context/cg_data";
import { useErc20Data } from "~/hooks";

export default function AirdropDetailView({
  airdrop,
}: {
  airdrop: Airdrop,
}) {
  const airdropItemsFetcher = useFetcher<AirdropItem[]>();
  const submit = useSubmit();
  const { isAdmin, __userInfoRawResponse, __communityInfoRawResponse } = useCgData();
  const { decimals, error: contractLoadError } = useErc20Data(airdrop.erc20Address as `0x${string}`, airdrop.chainId);

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
          {!airdropItems ? <div>Loading items...</div> : decimals === undefined ? <div>Loading contract data...</div> : null}
          {airdropItems && airdropItems.length === 0 && <div>No airdrop items found for this airdrop :(</div>}
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