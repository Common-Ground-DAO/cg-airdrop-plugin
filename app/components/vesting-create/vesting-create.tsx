import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useSubmit } from "react-router";
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from "wagmi";
import { useCgData } from "~/context/cg_data";
import { useVestingContractFactory } from "~/hooks";

/**
 * The vesting contract can actually handle multiple tokens,
 * but we're only supporting one for now for ease of use.
 */

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export interface VestingData {
  name: string;
  address: `0x${string}`;
  tokenAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  startTime: number;
  endTime: number;
}

export default function VestingCreate() {
  const [name, setName] = useState<string | undefined>(undefined);
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<`0x${string}` | undefined>(undefined);
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | undefined>(undefined);
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const factory = useVestingContractFactory();
  const { communityInfo, userInfo, __communityInfoRawResponse, __userInfoRawResponse } = useCgData();
  const fetcher = useFetcher();
  const [error, setError] = useState<string | null>(null);
  const { chain } = useAccount();
  const submit = useSubmit();
  const submitTriggered = useRef(false);

  const {
    deployContract,
    isPending,
    isSuccess,
    data: txHash
  } = useDeployContract();

  // Wait for the deployment transaction to be mined
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreateVesting = useCallback(() => {
    if (!communityInfo || !userInfo || !factory || !beneficiaryAddress || !startTime || !endTime || !tokenAddress) return;
    setError(null);

    if (!addressRegex.test(beneficiaryAddress)) {
      setError("Invalid beneficiary address");
      return;
    }

    if (!addressRegex.test(tokenAddress)) {
      setError("Invalid token address");
      return;
    }

    const startTimeSeconds = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimeSeconds = Math.floor(new Date(endTime).getTime() / 1000);
    const durationSeconds = endTimeSeconds - startTimeSeconds;

    if (startTimeSeconds >= endTimeSeconds) {
      setError("Start time must be before end time");
      return;
    }

    deployContract({
      abi: factory.abi,
      bytecode: factory.bytecode,
      args: [beneficiaryAddress!, BigInt(startTimeSeconds), BigInt(durationSeconds)],
      chainId: chain?.id,
    }, {
      onError(error) {
        setError("Error deploying airdrop contract: " + error.message);
        console.error("Error deploying airdrop contract", error);
      },
    });
  }, [communityInfo, userInfo, deployContract, factory, chain?.id, beneficiaryAddress, startTime, endTime, tokenAddress]);

  // Submit to database when we have the contract address
  const handleSubmitToDatabase = useCallback(async (contractAddress: string) => {
    if (!communityInfo || !userInfo) return;

    console.log("Submitting airdrop to database with contract address:", contractAddress);

    const formData = new FormData();
    formData.append("name", name!);
    formData.append("communityId", communityInfo.id);
    formData.append("tokenAddress", tokenAddress!);
    formData.append("contractAddress", contractAddress);
    formData.append("chainId", chain?.id!.toString()!);
    formData.append("communityInfoRaw", __communityInfoRawResponse!);
    formData.append("userInfoRaw", __userInfoRawResponse!);

    try {
      await fetcher.submit(formData, { method: "post", action: "/api/vesting/create" });
    } catch (error) {
      console.error("Error submitting airdrop to database", error);
      setError("Error submitting airdrop to database");
    }
  }, [communityInfo, userInfo, submit, chain?.id, tokenAddress, name, __communityInfoRawResponse, __userInfoRawResponse]);

  const inProgress = isPending || isSuccess || isConfirming || isConfirmed;

  // Effect to handle successful deployment
  useEffect(() => {
    if (isConfirmed && receipt?.contractAddress) {
      if (!submitTriggered.current) {
        submitTriggered.current = true;
        handleSubmitToDatabase(receipt.contractAddress);
      }
    }
  }, [isConfirmed, receipt?.contractAddress, handleSubmitToDatabase]);

  return (
    <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
      <h1 className="text-xl font-bold p-4 pb-0">Create Vesting</h1>
      <div className="flex-1 flex flex-col w-full items-center overflow-hidden">
        <div className="w-md max-w-md">
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Display name for this vesting</legend>
            <input
              type="text"
              className="input w-[calc(100%-0.5rem)] ml-1"
              id="name"
              value={name || ''}
              onChange={(e) => setName(e.target.value)}
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Beneficiary address</legend>
            <input
              type="text"
              className="input w-[calc(100%-0.5rem)] ml-1"
              id="address"
              value={beneficiaryAddress || ''}
              onChange={(e) => setBeneficiaryAddress(e.target.value as `0x${string}`)}
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Token address</legend>
            <input
              type="text"
              className="input w-[calc(100%-0.5rem)] ml-1"
              id="tokenAddress"
              value={tokenAddress || ''}
              onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Start time</legend>
            <input
              type="datetime-local"
              className="input w-[calc(100%-0.5rem)] ml-1"
              id="vestingStart"
              value={startTime || ''}
              max={endTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">End time</legend>
            <input
              type="datetime-local"
              className="input w-[calc(100%-0.5rem)] ml-1"
              id="vestingEnd"
              value={endTime || ''}
              min={startTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </fieldset>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 m-4">
        <button
          className="btn btn-primary"
          onClick={() => console.log("Deploying vesting contract...")}
        >Finish</button>
      </div>
    </div>
  );
}