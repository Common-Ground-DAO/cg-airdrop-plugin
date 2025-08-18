import { NavLink, useNavigate, useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import type { Vesting } from "generated/prisma";
import { useErc20Abi, useTokenData, useVestingAbi } from "~/hooks";
import { useAccount, useReadContract, useTransactionReceipt, useWriteContract } from "wagmi";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoArrowBack, IoTrashOutline } from "react-icons/io5";
import TokenMetadataDisplay from "~/components/token-metadata-display";
import FormatUnits from "~/components/format-units/format-units";

export interface VestingDetailViewProps {
  vesting: Vesting;
  deleteVesting: (vestingId: number) => Promise<void>;
  deleteIsSubmitting: boolean;
}

export default function VestingDetailView({
  vesting,
  deleteVesting,
  deleteIsSubmitting,
}: VestingDetailViewProps) {
  const { isAdmin } = useCgData();
  const vestingAbi = useVestingAbi();
  const erc20Abi = useErc20Abi();
  const { address } = useAccount();
  const navigate = useNavigate();
  const submit = useSubmit();
  const tokenData = useTokenData(vesting.tokenAddress as `0x${string}`, vesting.chainId);
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
    writeContract({
      address: vesting.contractAddress as `0x${string}`,
      abi: vestingAbi || [],
      functionName: "release",
      args: [vesting.tokenAddress as `0x${string}`],
    });
  }, [writeContract, vesting.contractAddress, vesting.tokenAddress, vestingAbi]);

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
            <button
              className="btn btn-xs gap-1"
              onClick={() => {
                const formData = new FormData();
                formData.append("type", "vesting");
                formData.append("id", vesting.id.toString());
                submit(formData, { method: "post", action: `/api/verify-contract`, navigate: false });
              }}
            ><IoTrashOutline /><span>Verify Contract</span></button>
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
    </>
  );
}