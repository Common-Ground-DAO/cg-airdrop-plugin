import { NavLink, useNavigate, useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Vesting } from "generated/prisma";
import { useErc20Abi, useTokenData, useVestingAbi } from "~/hooks";
import { useAccount, useReadContract, useTransactionReceipt, useWriteContract } from "wagmi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoTrashOutline } from "react-icons/io5";
import { GrValidate } from "react-icons/gr";
import { MdArrowOutward } from "react-icons/md";
import TokenMetadataDisplay from "~/components/token-metadata-display";
import FormatUnits from "~/components/format-units/format-units";
import { useCgPluginLib } from "~/context/plugin_lib";
import type { VerificationStatus } from "~/lib/.server/verify";
import CollapsedError from "~/components/error";

export interface VestingDetailViewProps {
  vesting: Vesting;
  deleteVesting: (vestingId: number) => Promise<void>;
  deleteIsSubmitting: boolean;
  refreshVestings: () => void;
}

export default function VestingDetailView({
  vesting,
  deleteVesting,
  deleteIsSubmitting,
  refreshVestings,
}: VestingDetailViewProps) {
  const { isAdmin } = useCgData();
  const vestingAbi = useVestingAbi();
  const erc20Abi = useErc20Abi();
  const { address } = useAccount();
  const navigate = useNavigate();
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const tokenData = useTokenData(vesting.tokenAddress as `0x${string}`, vesting.chainId);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [verifyContractIn, setVerifyContractIn] = useState<string | null>(
    vesting.createdAt.getTime() > Date.now() - 1000 * 60 
    ? `${60 + Math.floor((vesting.createdAt.getTime() - Date.now()) / 1000)}s`
    : null);

  const {
    writeContract,
    isPending: isPendingWriteContract,
    isSuccess: isSuccessWriteContract,
    isError: isErrorWriteContract,
    error: writeContractError,
    data: writeContractData,
  } = useWriteContract();

  const pluginLib = useCgPluginLib();
  const navigateLink = useCallback((ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    ev.preventDefault();
    pluginLib?.navigate(ev.currentTarget.href);
  }, [pluginLib]);

  const verification = useMemo(() => {
    if (!vesting.verification) return null;
    return vesting.verification as VerificationStatus;
  }, [vesting.verification]);

  // Set interval for verifying contract button
  useEffect(() => {
    let interval: any;
    if (vesting.createdAt.getTime() > Date.now() - 1000 * 60) {
      setVerifyContractIn(`${Math.floor((vesting.createdAt.getTime() - Date.now()) / 1000)}s`);
      interval = setInterval(() => {
        if (vesting.createdAt.getTime() > Date.now() - 1000 * 60) {
          setVerifyContractIn(`${60 + Math.floor((vesting.createdAt.getTime() - Date.now()) / 1000)}s`);
        } else {
          clearInterval(interval);
          setVerifyContractIn(null);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [vesting.createdAt.getTime()]);

  // Close terms modal when release is running
  useEffect(() => {
    if (!isPendingWriteContract) return;
    (document.getElementById("airdrop-terms-modal") as any)?.close();
  }, [isPendingWriteContract]);

  const { data: transactionReceipt, isLoading: isLoadingTransactionReceipt, error: transactionReceiptError } = useTransactionReceipt({
    hash: writeContractData as `0x${string}`,
  });

  const [vestingTimestamp, setVestingTimestamp] = useState<bigint>(BigInt(Math.floor(Date.now() / 1000)));

  const { data: beneficiary, isLoading: isLoadingBeneficiary, error: beneficiaryError } = useReadContract({
    address: vesting.contractAddress as `0x${string}`,
    abi: vestingAbi || [],
    functionName: "beneficiary",
    args: [],
  });

  const { data: start, isLoading: isLoadingStart, error: startError, refetch: refetchStart } = useReadContract({
    address: vesting.contractAddress as `0x${string}`,
    abi: vestingAbi || [],
    functionName: "start",
    args: [],
  });

  const { data: duration, isLoading: isLoadingDuration, error: durationError, refetch: refetchDuration } = useReadContract({
    address: vesting.contractAddress as `0x${string}`,
    abi: vestingAbi || [],
    functionName: "duration",
    args: [],
  });

  const { data: releasable, isLoading: isLoadingReleasable, error: releasableError, refetch: refetchReleasable } = useReadContract({
    address: vesting.contractAddress as `0x${string}`,
    abi: vestingAbi || [],
    functionName: "releasable",
    args: [vesting.tokenAddress as `0x${string}`],
  });

  const { data: released, isLoading: isLoadingReleased, error: releasedError, refetch: refetchReleased } = useReadContract({
    address: vesting.contractAddress as `0x${string}`,
    abi: vestingAbi || [],
    functionName: "released",
    args: [vesting.tokenAddress as `0x${string}`],
  });

  const { data: vestedAmount, isLoading: isLoadingVestedAmount, error: vestedAmountError, refetch: refetchVestedAmount } = useReadContract({
    address: vesting.contractAddress as `0x${string}`,
    abi: vestingAbi || [],
    functionName: "vestedAmount",
    args: [vesting.tokenAddress as `0x${string}`, BigInt(vestingTimestamp)],
  });

  const { data: balance, isLoading: isLoadingBalance, error: balanceError, refetch: refetchBalance } = useReadContract({
    address: vesting.tokenAddress as `0x${string}`,
    abi: erc20Abi || [],
    functionName: "balanceOf",
    args: [vesting.contractAddress as `0x${string}`],
  });

  const release = useCallback(async () => {
    if (vesting.termsLink && !termsAccepted) {
      (document.getElementById("vesting-terms-modal") as any)?.showModal();
      return;
    }
    writeContract({
      address: vesting.contractAddress as `0x${string}`,
      abi: vestingAbi || [],
      functionName: "release",
      args: [vesting.tokenAddress as `0x${string}`],
    });
  }, [writeContract, vesting.contractAddress, vesting.tokenAddress, vestingAbi, termsAccepted]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVestingTimestamp(BigInt(Math.floor(Date.now() / 1000)));
      refetchReleasable();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Todo: wait for confirmations instead?
    if (!!transactionReceipt) {
      refetchBalance();
      refetchReleased();
      refetchReleasable();
      refetchVestedAmount();
    }
  }, [transactionReceipt, refetchBalance, refetchReleased, refetchReleasable, refetchVestedAmount]);

  const verifyContract = useCallback(() => {
    if (
      vesting.createdAt.getTime() > Date.now() - 1000 * 60 ||
      verifyState === "loading" ||
      verifyState === "success"
    ) {
      return;
    }
    setVerifyState("loading");
    const formData = new FormData();
    formData.append("type", "vesting");
    formData.append("id", vesting.id.toString());
    fetch(`${import.meta.env.BASE_URL || '/'}api/verify-contract`, { method: "post", body: formData })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setVerifyState("success");
            refreshVestings();
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
  }, [vesting.id, refreshVestings, vesting.createdAt, verifyState]);

  const releasableRef = useRef<bigint | undefined>(undefined);
  const releasedRef = useRef<bigint | undefined>(undefined);
  const vestedAmountRef = useRef<bigint | undefined>(undefined);
  const balanceRef = useRef<bigint | undefined>(undefined);

  if (typeof releasable === "bigint") {
    releasableRef.current = releasable;
  }

  if (typeof released === "bigint") {
    releasedRef.current = released;
  }

  if (typeof vestedAmount === "bigint") {
    vestedAmountRef.current = vestedAmount;
  }

  if (typeof balance === "bigint") {
    balanceRef.current = balance;
  }

  const isLoading = isLoadingBeneficiary || isLoadingStart || isLoadingDuration;
  const errors = [beneficiaryError, startError, durationError, releasableError, releasedError, vestedAmountError].filter(Boolean);

  const showVerifyButton = isAdmin && (!verification?.blockscoutResponse || !verification?.etherscanResponse) && verifyState !== "success";

  return (
    <>
      <div className="flex flex-col gap-4 overflow-hidden">
        <nav className="flex flex-row gap-2 items-center m-4 mb-0">
          <NavLink to="/vestings" className="text-xl font-bold hover:underline">
            Vestings
          </NavLink>
          <div className="text-xl font-bold">&gt;</div>
          <div className="text-xl font-bold">{vesting.name}</div>
          {isAdmin && <div className="flex flex-row items-center justify-end flex-1 shrink-0">
            <button
              className="btn btn-error btn-xs gap-1"
              onClick={() => (document.getElementById("delete-vesting-modal") as any)?.showModal()}
            ><IoTrashOutline /><span>Delete Vesting</span></button>
            {showVerifyButton && <button
              className="btn btn-xs gap-1"
              onClick={verifyContract}
              disabled={verifyContractIn !== null}
            ><GrValidate /><span>{verifyContractIn !== null ? `Verify in ${verifyContractIn}` : "Verify Contract"}</span></button>}
          </div>}
        </nav>
        {isLoading && !errors.length && (
          <div className="flex flex-col items-center flex-1 gap-4 overflow-auto">
            <div className="flex flex-col max-w-full justify-start gap-4 mt-8">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          </div>
        )}
        {errors.map((error) => <CollapsedError error={error} />)}
        {!isLoading && !errors.length && <div className="flex flex-col items-center flex-1 gap-4 overflow-auto">
          <div className="flex flex-col w-lg max-w-lg justify-start gap-4">
            <TokenMetadataDisplay
              tokenData={tokenData}
              chainId={vesting.chainId}
              tokenAddress={vesting.tokenAddress as `0x${string}`}
              small={true}
            />
          </div>
          <div className="card card-sm bg-base-300 shadow-lg">
            <div className="card-body">
              <table className="table w-md max-w-md">
                <tbody>
                  <tr>
                    <td>Beneficiary</td>
                    <td className="text-right">{beneficiary}</td>
                  </tr>
                  <tr>
                    <td>Vesting contract</td>
                    <td className="text-right">
                      {vesting.contractAddress}
                    </td>
                  </tr>
                  <tr>
                    <td>Start</td>
                    <td className="text-right">{new Date(Number(start) * 1000).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>End</td>
                    <td className="text-right">{new Date(Number(start) * 1000 + Number(duration) * 1000).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Released</td>
                    <td className="text-right">
                      {typeof releasedRef.current === "bigint"
                        ? <FormatUnits className="text-right" value={releasedRef.current} decimals={tokenData.decimals || 0} />
                        : "loading..."}
                    </td>
                  </tr>
                  <tr>
                    <td>Releasable</td>
                    <td className="text-right">
                      {typeof releasableRef.current === "bigint"
                        ? <FormatUnits className="text-right" value={releasableRef.current} decimals={tokenData.decimals || 0} />
                        : "loading..."}
                    </td>
                  </tr>
                  <tr>
                    <td>Vested</td>
                    <td className="text-right">
                      {typeof vestedAmountRef.current === "bigint"
                        ? <FormatUnits className="text-right" value={vestedAmountRef.current} decimals={tokenData.decimals || 0} />
                        : "loading..."}
                    </td>
                  </tr>
                  <tr>
                    <td>Total vesting amount</td>
                    <td className="text-right">
                      {typeof balanceRef.current === "bigint" && typeof releasedRef.current === "bigint"
                        ? <FormatUnits className="text-right" value={balanceRef.current + releasedRef.current} decimals={tokenData.decimals || 0} />
                        : "loading..."}
                    </td>
                  </tr>
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
                  {vesting.termsLink && <tr>
                    <td>Terms</td>
                    <td>
                      <a href={vesting.termsLink} onClick={(ev) => navigateLink(ev)} rel="noopener noreferrer">
                        <MdArrowOutward className="inline-block mr-1" />
                        View terms
                      </a>
                    </td>
                  </tr>}
                </tbody>
              </table>
              <div className="flex flex-col items-center gap-2 m-4">
                {vesting.beneficiaryAddress.toLowerCase() === address?.toLowerCase()
                  ? <button className="btn btn-primary" onClick={release}>Release</button>
                  : "Connect beneficiary wallet to release"
                }
              </div>
            </div>
          </div>
        </div>}
      </div>
      <dialog id="delete-vesting-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Are you sure you want to delete this vesting?</h3>
          <p className="py-4">This action cannot be undone and does not affect any deployed contracts.</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-soft">Cancel</button>
            </form>
            <button
              className="btn btn-error"
              onClick={() => deleteVesting(vesting.id).then(() => navigate("/vestings"))}
              disabled={deleteIsSubmitting}
            >Delete</button>
          </div>
        </div>
      </dialog>
      <dialog id="vesting-terms-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Do you accept the terms of the vesting?</h3>
          <div>
            <a href={vesting.termsLink || ""} onClick={(ev) => navigateLink(ev)} rel="noopener noreferrer">View terms</a>
          </div>
          <label className="label">
            <input type="checkbox" className="checkbox" checked={termsAccepted} onChange={(ev) => setTermsAccepted(ev.target.checked)} />
            I accept the terms of the vesting
          </label>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-soft">Cancel</button>
            </form>
            {vesting.beneficiaryAddress.toLowerCase() === address?.toLowerCase() && <button
              className={`btn btn-primary`}
              onClick={release}
              disabled={!termsAccepted}
            >Release</button>}
          </div>
        </div>
      </dialog>
    </>
  );
}