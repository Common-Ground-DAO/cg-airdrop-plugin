import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate, useSubmit } from "react-router";
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
  beneficiaryAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  contractAddress?: `0x${string}`;
  startTimeSeconds: number;
  endTimeSeconds: number;
}

export default function VestingCreate() {
  const [name, setName] = useState<string | undefined>(undefined);
  const [vestingData, setVestingData] = useState<VestingData | undefined>(undefined);
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
  const navigate = useNavigate();

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
    let startTimeSeconds: number | undefined;
    let endTimeSeconds: number | undefined;
    if (startTime) {
      try {
        startTimeSeconds = Math.floor((new Date(startTime)).getTime() / 1000);
      }
      catch (e) {}
    }
    if (endTime) {
      try {
        endTimeSeconds = Math.floor((new Date(endTime)).getTime() / 1000);
      }
      catch (e) {}
    }
    if (startTimeSeconds === undefined || endTimeSeconds === undefined || endTimeSeconds < startTimeSeconds) {
      setError("Invalid start or end time");
    }
    else if (!communityInfo || !userInfo) {
      setError("Invalid community or user");
    }
    else if (!factory) {
      setError("Invalid contract factory");
    }
    else if (!name) {
      setError("Invalid name");
    }
    else if (!beneficiaryAddress || !addressRegex.test(beneficiaryAddress)) {
      setError("Invalid beneficiary address");
    }
    else if (!tokenAddress || !addressRegex.test(tokenAddress)) {
      setError("Invalid token address");
    }
    else if (chain?.id === undefined) {
      setError("Invalid chain");
    }
    else {
      setError(null);
      const durationSeconds = endTimeSeconds - startTimeSeconds;
      setVestingData({
        name,
        beneficiaryAddress,
        tokenAddress,
        chainId: chain?.id,
        startTimeSeconds,
        endTimeSeconds,
      });

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
    }
  }, [communityInfo, userInfo, deployContract, factory, chain?.id, beneficiaryAddress, startTime, endTime, tokenAddress]);

  // Submit to database when we have the contract address
  const handleSubmitToDatabase = useCallback(async (contractAddress: string) => {
    if (!communityInfo || !userInfo) return;
    if (!vestingData) {
      setError("Invalid vesting data");
      return;
    };

    console.log("Submitting airdrop to database with contract address:", contractAddress);

    const formData = new FormData();
    formData.append("name", vestingData.name);
    formData.append("beneficiaryAddress", vestingData.beneficiaryAddress);
    formData.append("tokenAddress", vestingData.tokenAddress);
    formData.append("contractAddress", contractAddress);
    formData.append("chainId", vestingData.chainId.toString());
    formData.append("startTimeSeconds", vestingData.startTimeSeconds.toString());
    formData.append("endTimeSeconds", vestingData.endTimeSeconds.toString());
    formData.append("communityInfoRaw", __communityInfoRawResponse!);
    formData.append("userInfoRaw", __userInfoRawResponse!);

    try {
      await fetcher.submit(formData, { method: "post", action: "/api/vesting/create" });
    } catch (error) {
      console.error("Error submitting airdrop to database", error);
      setError("Error submitting airdrop to database");
    }
  }, [communityInfo, userInfo, submit, vestingData, __communityInfoRawResponse, __userInfoRawResponse]);

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
          {error && <div className="collapse collapse-arrow bg-error">
            <input type="checkbox" />
            <div className="collapse-title font-semibold">Error</div>
            <div className="collapse-content text-sm">
              {error}
            </div>  
          </div>}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 m-4">
        {!inProgress && !fetcher.data && (
          <button
            className="btn btn-primary"
            onClick={handleCreateVesting}
          >Deploy and Submit</button>
        )}
        {inProgress && !fetcher.data && (
          <button
            className="btn btn-primary"
            disabled
          >Deploying...</button>
        )}
        {fetcher.data && (
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/airdrops/${fetcher.data.airdropId}`)}
          >Finish</button>
        )}
      </div>
    </div>
  );
}