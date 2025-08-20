import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useFetcher, useNavigate, useSubmit } from "react-router";
import type { Airdrop, AirdropItem, MerkleTree } from "generated/prisma";
import { IoTrashOutline } from "react-icons/io5";
import { GrValidate } from "react-icons/gr";
import { MdArrowOutward } from "react-icons/md";
import FormatUnits from "../../format-units/format-units";
import { useCgData } from "~/context/cg_data";
import { useAirdropAbi, useTokenData } from "~/hooks";
import { useAccount, useReadContract, useTransactionReceipt, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { StandardMerkleTreeData } from "@openzeppelin/merkle-tree/dist/standard";
import TokenMetadataDisplay from "~/components/token-metadata-display";
import { useErc20Abi, useLsp7Abi } from "~/hooks/contracts";
import type { VerificationStatus } from "~/lib/.server/verify";
import { useCgPluginLib } from "~/context/plugin_lib";

export interface AirdropDetailViewProps {
  airdrop: Airdrop;
  deleteAirdrop: (airdropId: number) => Promise<void>;
  deleteIsSubmitting: boolean;
  refreshAirdrops: () => void;
}

export default function AirdropDetailView({
  airdrop,
  deleteAirdrop,
  deleteIsSubmitting,
  refreshAirdrops,
}: AirdropDetailViewProps) {
  const airdropItemsFetcher = useFetcher<{
    airdropItems: AirdropItem[];
    merkleTree: MerkleTree;
  }>();
  const { isAdmin } = useCgData();
  const tokenData = useTokenData(airdrop.tokenAddress as `0x${string}`, airdrop.chainId);
  const { address } = useAccount();
  const [fundsToAdd, _setFundsToAdd] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const airdropAbi = useAirdropAbi();
  const erc20Abi = useErc20Abi();
  const lsp7Abi = useLsp7Abi();
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const pluginLib = useCgPluginLib();
  const navigateLink = useCallback((ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    ev.preventDefault();
    pluginLib?.navigate(ev.currentTarget.href);
  }, [pluginLib]);

  const verification = useMemo(() => {
    if (!airdrop.verification) return null;
    return airdrop.verification as VerificationStatus;
  }, [airdrop.verification]);

  const {
    writeContract,
    isPending: isPendingWriteContract,
    isSuccess: isSuccessWriteContract,
    isError: isErrorWriteContract,
    error: writeContractError,
    data: writeContractData,
  } = useWriteContract();

  const { data: transactionReceipt, isLoading: isLoadingTransactionReceipt, error: transactionReceiptError } = useTransactionReceipt({
    hash: writeContractData as `0x${string}`,
  });

  const setFundsToAdd = useCallback((value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      _setFundsToAdd(value);
    }
  }, []);

  useEffect(() => {
    if (airdrop?.id === undefined) return;
    airdropItemsFetcher.submit({ airdropId: airdrop.id }, { method: "post", action: `/api/airdrop/details` });
  }, [airdrop?.id]);

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

  const totalAirdropAmount = useMemo(() => {
    return (airdropItemsFetcher.data?.airdropItems || []).reduce<bigint>((acc, item) => acc + BigInt(item.amount), 0n);
  }, [airdropItemsFetcher.data?.airdropItems]);

  const { data: totalClaimedAmount, isLoading: isLoadingTotalClaimedAmount, error: totalClaimedAmountError, refetch: refetchTotalClaimedAmount } = useReadContract({
    address: airdrop.airdropAddress as `0x${string}`,
    abi: airdropAbi || [],
    functionName: "totalClaimed",
    args: [],
  });

  const { data: airdropContractBalance, isLoading: isLoadingAirdropContractBalance, error: airdropContractBalanceError, refetch: refetchAirdropContractBalance } = useReadContract({
    address: airdrop.tokenAddress as `0x${string}`,
    abi: erc20Abi || [],
    functionName: "balanceOf",
    args: [airdrop.airdropAddress as `0x${string}`],
  });

  const { data: hasClaimed, isLoading: isLoadingHasClaimed, error: hasClaimedError, refetch: refetchHasClaimed } = useReadContract({
    address: airdrop.airdropAddress as `0x${string}`,
    abi: airdropAbi || [],
    functionName: "hasClaimed",
    args: [address!, BigInt(ownAirdropItems[0]?.amount || "0")],
  });

  const [transferAbi, transferArgs] =  useMemo(() => {
    let abi: typeof erc20Abi | typeof lsp7Abi | undefined;
    let args: any[] = [];
    if (tokenData.decimals === undefined || fundsToAdd === undefined) return [abi, args];
    if (tokenData.type === "erc20") {
      abi = erc20Abi;
      args = [airdrop.airdropAddress as `0x${string}`, parseUnits(fundsToAdd, tokenData.decimals)];
    } else if (tokenData.type === "lsp7") {
      abi = lsp7Abi;
      args = [address, airdrop.airdropAddress as `0x${string}`, parseUnits(fundsToAdd, tokenData.decimals), true, ""];
    }
    return [abi, args];
  }, [tokenData.type, erc20Abi, lsp7Abi, airdrop.airdropAddress, fundsToAdd]);

  const missingFunds = useMemo(() => {
    if (airdropContractBalance === undefined || totalClaimedAmount === undefined || tokenData.decimals === undefined) return 0n;
    return totalAirdropAmount - airdropContractBalance - totalClaimedAmount;
  }, [airdropContractBalance, totalClaimedAmount, totalAirdropAmount, tokenData.decimals]);

  useEffect(() => {
    if (fundsToAdd !== undefined) return;
    if (missingFunds > 0n && tokenData.decimals !== undefined) {
      const missingFundsStr = formatUnits(missingFunds, tokenData.decimals);
      setFundsToAdd(missingFundsStr);
    }
  }, [fundsToAdd, missingFunds]);

  useEffect(() => {
    // Todo: wait for confirmations instead?
    if (!!transactionReceipt) {
      refetchTotalClaimedAmount();
      refetchAirdropContractBalance();
      refetchHasClaimed();
    }
  }, [transactionReceipt, refetchTotalClaimedAmount, refetchAirdropContractBalance, refetchHasClaimed]);

  const claimAirdrop = useCallback((itemAddress: string, amountStr: `${number}`) => {
    if (!merkleTree) return;
    let amount = 0n;
    try {
      amount = BigInt(amountStr);
    }
    catch (e) {
      console.error("Error parsing amount: ", e);
      return;
    }
    const proofIndex = addressToProofIndexMap.get(itemAddress.toLowerCase());
    if (proofIndex !== undefined) {
      const proof = merkleTree.getProof(proofIndex);
      console.log("Claiming amount: ", amount, " with proof: ", proof);
      if (tokenData.type === "erc20") {
        writeContract({
          address: airdrop.airdropAddress as `0x${string}`,
          abi: airdropAbi || [],
          functionName: "claimERC20",
          args: [amount, proof as `0x${string}`[]],
        });
      } else if (tokenData.type === "lsp7") {
        writeContract({
          address: airdrop.airdropAddress as `0x${string}`,
          abi: airdropAbi || [],
          functionName: "claimLSP7",
          args: [amount, proof as `0x${string}`[], true],
        });
      }
    }
  }, [merkleTree, addressToProofIndexMap, airdrop.airdropAddress, airdropAbi, writeContract, tokenData.type]);

  const fundAirdropContract = useCallback(() => {
    if (!transferAbi || airdrop.tokenAddress === undefined) return;
    writeContract({
      address: airdrop.tokenAddress as `0x${string}`,
      abi: transferAbi,
      functionName: "transfer",
      args: transferArgs as any,
    });
  }, [writeContract, transferAbi, transferArgs, airdrop.tokenAddress, fundsToAdd, tokenData.decimals]);

  const verifyContract = useCallback(() => {
    if (
      airdrop.createdAt.getTime() > Date.now() - 1000 * 60 ||
      verifyState === "loading" ||
      verifyState === "success"
    ) {
      return;
    }
    setVerifyState("loading");
    const formData = new FormData();
    formData.append("type", "airdrop");
    formData.append("id", airdrop.id.toString());
    fetch('/api/verify-contract', { method: "post", body: formData })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setVerifyState("success");
            refreshAirdrops();
          }
          else {
            console.error("Error verifying contract: ", data.error);
            setVerifyState("error");
          }
        }
        else {
          console.error("Error verifying contract: ", res.statusText);
          setVerifyState("error");
        }
      })
      .catch((err) => {
        console.error("Error verifying contract: ", err);
        setVerifyState("error");
      });
  }, [airdrop.id, refreshAirdrops, airdrop.createdAt, verifyState]);

  const hasItems = ownAirdropItems.length > 0 || otherAirdropItems.length > 0;

  const errors = [
    totalClaimedAmountError,
    airdropContractBalanceError, 
  ].filter(Boolean);

  const isLoading =
    isLoadingTotalClaimedAmount ||
    isLoadingAirdropContractBalance ||
    isLoadingHasClaimed ||
    totalClaimedAmount === undefined ||
    airdropContractBalance === undefined ||
    airdropItemsFetcher.data === undefined ||
    tokenData.isFetching ||
    !airdropAbi || !erc20Abi || !lsp7Abi;

  const showVerifyButton = isAdmin && (!verification?.blockscoutResponse || !verification?.etherscanResponse) && verifyState !== "success";

  return (
    <>
      <div className="flex flex-col gap-4 overflow-hidden">
        <nav className="flex flex-row gap-2 items-center m-4 mb-0">
          <NavLink to="/airdrops" className="text-xl font-bold hover:underline">
            Airdrops
          </NavLink>
          <div className="text-xl font-bold">&gt;</div>
          <div className="text-xl font-bold">{airdrop.name}</div>
          {isAdmin && <div className="flex flex-row items-center justify-end flex-1 shrink-0">
            <button
              className="btn btn-error btn-xs gap-1"
              onClick={() => (document.getElementById("delete-airdrop-modal") as any)?.showModal()}
            ><IoTrashOutline /><span>Delete Airdrop</span></button>
            {showVerifyButton && <button
              className="btn btn-xs gap-1"
              onClick={verifyContract}
            ><GrValidate /><span>Verify Contract</span></button>}
          </div>}
        </nav>
        {isLoading && !errors.length && (
          <div className="flex flex-col items-center flex-1 gap-4 overflow-auto">
            <div className="flex flex-col max-w-full justify-start gap-4 mt-8">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          </div>
        )}
        {errors.map((error) => <div className="collapse collapse-arrow bg-error border-base-300 border grid-cols-[100%]">
          <input type="checkbox" />
          <div className="collapse-title font-semibold">
            Error
          </div>
          <div className="collapse-content text-sm">
            <div className="max-w-full wrap-break-word">
              {error?.message || "Unknown error"}
            </div>
          </div>
        </div>)}
        {!isLoading && !errors.length && <div className="flex flex-col items-center flex-1 gap-4 overflow-auto">
          <div className="flex flex-col max-w-full justify-start gap-4">
            <TokenMetadataDisplay
              tokenData={tokenData}
              chainId={airdrop.chainId}
              tokenAddress={airdrop.tokenAddress as `0x${string}`}
              small={true}
            />
            <div className="card card-sm bg-base-300 shadow-lg">
              <div className="card-body">
                <table className="table w-fit">
                  <tbody>
                    <tr>
                      <td colSpan={2} className="text-left">
                        <div className="flex flex-col gap-2">
                          <div>
                            <h2 className="font-semibold">Progress: {(Number(totalClaimedAmount) / Number(totalAirdropAmount) * 100).toFixed(2)}%</h2>
                            <div className="w-full">
                              <progress className="progress progress-primary w-full" value={Number(totalClaimedAmount) / Number(totalAirdropAmount)} max={1}></progress>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Total airdrop amount</td>
                      <td><FormatUnits className="text-right" value={totalAirdropAmount.toString()} decimals={tokenData.decimals || 0} /></td>
                    </tr>
                    <tr>
                      <td>Total claimed amount</td>
                      <td><FormatUnits className="text-right" value={totalClaimedAmount?.toString() || "0"} decimals={tokenData.decimals || 0} /></td>
                    </tr>
                    <tr>
                      <td>Airdrop contract balance</td>
                      <td><FormatUnits className="text-right" value={airdropContractBalance?.toString() || "0"} decimals={tokenData.decimals || 0} /></td>
                    </tr>
                    {missingFunds > 0n && <>
                      <tr>
                        <td>Missing funds</td>
                        <td><FormatUnits className="text-right" value={missingFunds.toString()} decimals={tokenData.decimals || 0} /></td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="text-center">
                          <div className="join">
                            <input type="text" className="input input-bordered join-item" value={fundsToAdd || ""} onChange={(e) => setFundsToAdd(e.target.value)} />
                            <button className="btn btn-primary join-item" onClick={fundAirdropContract}>
                              Add funds
                            </button>
                          </div>
                        </td>
                      </tr>
                    </>}
                    {verification && verification.verifiedUrls.length > 0 && <tr>
                      <td>Contract verified on:</td>
                      <td>
                        {verification.verifiedUrls.map((url) => <div>
                          <a href={url} onClick={(ev) => navigateLink(ev)} rel="noopener noreferrer">
                            <MdArrowOutward className="inline-block mr-1" />
                            {url.match(/^https?:\/\/([^/]+)/)?.[1] || url}
                          </a>
                        </div>)}
                      </td>
                    </tr>}
                    {airdrop.termsLink && <tr>
                      <td>Terms</td>
                      <td>
                        <a href={airdrop.termsLink} onClick={(ev) => navigateLink(ev)} rel="noopener noreferrer">
                          <MdArrowOutward className="inline-block mr-1" />
                          View terms
                        </a>
                      </td>
                    </tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {writeContractError && <div className="collapse collapse-arrow bg-error border-base-300 border grid-cols-[100%]">
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                Error
              </div>
              <div className="collapse-content text-sm">
                <div className="max-w-full wrap-break-word">
                  {writeContractError.message || "Unknown error"}
                </div>
              </div>
            </div>}
          </div>
          {hasItems && tokenData.decimals !== undefined && <table className="table w-fit">
            <tbody>
              <tr>
                <th className="p-2 border-b">Address</th>
                <th className="p-2 border-b">Amount</th>
                <th className="p-2 border-b"></th>
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
                        className={`btn btn-xs ${hasClaimed ? "btn-success" : "btn-primary"}`}
                        onClick={() => !hasClaimed && claimAirdrop(item.address, item.amount as `${number}`)}
                        disabled={isLoadingHasClaimed}
                      >{hasClaimed ? "Claimed" : "Claim"}</button>
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
        </div>}
      </div>
      <dialog id="delete-airdrop-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Are you sure you want to delete this airdrop?</h3>
          <p className="py-4">This action cannot be undone and does not affect any deployed contracts.</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-soft">Cancel</button>
            </form>
            <button
              className="btn btn-error"
              onClick={() => deleteAirdrop(airdrop.id).then(() => navigate("/airdrops"))}
              disabled={deleteIsSubmitting}
            >Delete</button>
          </div>
        </div>
      </dialog>
    </>
  );
}