import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useFetcher, useNavigate, useSubmit } from "react-router";
import type { Airdrop, AirdropItem, MerkleTree } from "generated/prisma";
import { IoArrowBack } from "react-icons/io5";
import FormatUnits from "../../format-units/format-units";
import { useCgData } from "~/context/cg_data";
import { useTokenData } from "~/hooks";
import { useAccount } from "wagmi";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { StandardMerkleTreeData } from "@openzeppelin/merkle-tree/dist/standard";
import TokenMetadataDisplay from "~/components/token-metadata-display";

export default function AirdropDetailView({
  airdrop,
}: {
  airdrop: Airdrop,
}) {
  const airdropItemsFetcher = useFetcher<{
    airdropItems: AirdropItem[];
    merkleTree: MerkleTree;
  }>();
  const submit = useSubmit();
  const { isAdmin, __userInfoRawResponse, __communityInfoRawResponse } = useCgData();
  const tokenData = useTokenData(airdrop.tokenAddress as `0x${string}`, airdrop.chainId);
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (airdrop?.id === undefined) return;
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/details` });
  }, [airdrop?.id]);

  const deleteAirdrop = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("airdropId", airdrop.id.toString());
      formData.append("communityInfoRaw", __communityInfoRawResponse || "");
      formData.append("userInfoRaw", __userInfoRawResponse || "");
      await submit(formData, { method: "post", action: `/api/airdrop/delete`, navigate: false });
    }
    finally {
      setIsSubmitting(false);
    }
  }, [airdrop, submit, __userInfoRawResponse, __communityInfoRawResponse]);

  const { ownAirdropItems, otherAirdropItems } = useMemo(() => {
    const lowerCaseAddress = address?.toLowerCase();
    const airdropItems = airdropItemsFetcher.data?.airdropItems;
    if (!lowerCaseAddress) return { ownAirdropItems: [], otherAirdropItems: airdropItems || [] };
    let ownAirdropItems: AirdropItem[] = [];
    const otherAirdropItems: AirdropItem[] = [];
    for (const item of airdropItems || []) {
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

  const merkleTree = useMemo(() => {
    const treeData = airdropItemsFetcher.data?.merkleTree;
    if (!treeData) return null;
    return StandardMerkleTree.load(treeData.data as unknown as StandardMerkleTreeData<[string, string]>);
  }, [airdropItemsFetcher.data?.merkleTree]);

  const addressToProofIndexMap = useMemo(() => {
    if (!merkleTree) return new Map<string, number>();
    const resultMap = new Map<string, number>();
    for (const [i, v] of merkleTree.entries()) {
      resultMap.set(v[0].toLowerCase(), i);
    }
    return resultMap;
  }, [merkleTree]);

  const claimAirdrop = useCallback((itemAddress: string) => {
    if (!merkleTree) return;
    const proofIndex = addressToProofIndexMap.get(itemAddress.toLowerCase());
    if (proofIndex !== undefined) {
      const proof = merkleTree.getProof(proofIndex);
      console.log("Proof: ", proof);
    }
  }, [merkleTree, addressToProofIndexMap]);

  const hasItems = ownAirdropItems.length > 0 || otherAirdropItems.length > 0;

  return (
    <div className="card bg-base-100 overflow-hidden p-4 flex flex-col flex-1 mr-4 shadow-md">
      <div className="flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-row gap-1 items-center">
          <NavLink to="/" className="btn btn-ghost btn-circle">
            <IoArrowBack className="w-4 h-4" />
          </NavLink>
          <h1 className="text-3xl font-bold">{airdrop.name}</h1>
        </div>
        <div className="flex flex-col flex-1 gap-4 overflow-auto">
          <TokenMetadataDisplay tokenData={tokenData} />
          {hasItems && tokenData.decimals !== undefined && <table className="table grow">
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
                    <FormatUnits className="text-right text-success" value={item.amount} decimals={tokenData.decimals || 0} />
                  </td>
                  <td className={`${index === ownAirdropItems.length - 1 && otherAirdropItems.length === 0 ? "" : "border-b"}`}>
                    <div className="flex flex-col items-center">
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => claimAirdrop(item.address)}
                      >Claim</button>
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
                    <FormatUnits className="text-right" value={item.amount} decimals={tokenData.decimals || 0} />
                  </td>
                  <td className={`p-2 ${index === otherAirdropItems.length - 1 ? "" : "border-b"}`}></td>
                </tr>
              ))}
            </tbody>
          </table>}
          {!airdropItemsFetcher.data ? <div className="grow">Loading items...</div> : tokenData.decimals === undefined ? <div className="grow">Loading contract data...</div> : null}
          {airdropItemsFetcher.data?.airdropItems.length === 0 && <div>No airdrop items found for this airdrop :(</div>}
          {tokenData.error && <div>Error: {tokenData.error.message}</div>}
        </div>
      </div>
      {isAdmin && <div className="flex flex-row gap-4 w-full items-center justify-center mt-auto pt-3">
        <span className="text-xs">Admin Actions</span>
        <button
          className="btn btn-error btn-sm"
          onClick={() => (document.getElementById("delete-airdrop-modal") as any)?.showModal()}
        >Delete Airdrop</button>
      </div>}
      {isAdmin && <dialog id="delete-airdrop-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Are you sure you want to delete this airdrop?</h3>
          <p className="py-4">This action cannot be undone.</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-soft">Cancel</button>
            </form>
            <button
              className="btn btn-error"
              onClick={deleteAirdrop}
              disabled={isSubmitting}
            >Delete</button>
          </div>
        </div>
      </dialog>}
    </div>
  );
}