import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useNavigate, useSubmit } from "react-router";
import { useAccount, useDeployContract, useTransactionConfirmations, useWaitForTransactionReceipt } from "wagmi";
import { useCgData } from "~/context/cg_data";
import { useTokenData, useVestingContractFactory } from "~/hooks";
import type { TokenData } from "~/hooks/token-data";
import TokenMetadataDisplay from "../token-metadata-display";
import { useOpenzeppelinVestingContractFactory } from "~/hooks/contracts";
import type { LSP7Vesting__factory, VestingWallet__factory } from "~/contracts";
import CollapsedError from "../error";

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
  tokenData?: TokenData;
}

export default function VestingCreate() {
  const [name, setName] = useState<string | undefined>(undefined);
  const [vestingData, setVestingData] = useState<VestingData | undefined>(undefined);
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<`0x${string}` | undefined>(undefined);
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | undefined>(undefined);
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [termsLink, setTermsLink] = useState<string | undefined>(undefined);
  const customVestingFactory = useVestingContractFactory();
  const openzeppelinVestingFactory = useOpenzeppelinVestingContractFactory();
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

  const {
    data: transactionConfirmations,
    isLoading: isLoadingTransactionConfirmations,
    error: transactionConfirmationsError
  } = useTransactionConfirmations({
    hash: txHash,
  });


  const validAddress = useMemo(() => {
    if (tokenAddress && addressRegex.test(tokenAddress || "")) {
      return tokenAddress as `0x${string}`;
    }
    return undefined;
  }, [tokenAddress]);

  const tokenData = useTokenData(validAddress, chain?.id);

  useEffect(() => {
    if (!!tokenData) {
      setVestingData(old => ({
        ...old!,
        tokenData,
      }));
    }
  }, [tokenData]);

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
    else if (!customVestingFactory || !openzeppelinVestingFactory) {
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
      setVestingData(old => ({
        name,
        beneficiaryAddress,
        tokenAddress,
        chainId: chain?.id,
        startTimeSeconds,
        endTimeSeconds,
        tokenData: old?.tokenData,
        termsLink,
      }));

      let vestingFactory: typeof VestingWallet__factory | typeof LSP7Vesting__factory = openzeppelinVestingFactory;
      if (tokenData.type === "lsp7") {
        vestingFactory = customVestingFactory;
      }

      deployContract({
        abi: vestingFactory.abi,
        bytecode: vestingFactory.bytecode,
        args: [beneficiaryAddress!, BigInt(startTimeSeconds), BigInt(durationSeconds)],
        chainId: chain?.id,
      }, {
        onError(error) {
          setError("Error deploying vesting contract: " + error.message);
          console.error("Error deploying vesting contract", error);
        },
      });
    }
  }, [communityInfo, userInfo, deployContract, customVestingFactory, openzeppelinVestingFactory, chain?.id, beneficiaryAddress, startTime, endTime, tokenAddress, termsLink]);

  // Submit to database when we have the contract address
  const handleSubmitToDatabase = useCallback(async (contractAddress: string) => {
    if (!communityInfo || !userInfo) return;
    if (!vestingData) {
      setError("Invalid vesting data");
      return;
    };

    console.log("Submitting vesting to database with contract address:", contractAddress);

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
    formData.append("isLSP7", tokenData.type === "lsp7" ? "true" : "false");
    formData.append("termsLink", termsLink || "");

    try {
      await fetcher.submit(formData, { method: "post", action: "/api/vesting/create" });
    } catch (error) {
      console.error("Error submitting vesting to database", error);
      setError("Error submitting vesting to database");
    }
  }, [communityInfo, userInfo, submit, vestingData, __communityInfoRawResponse, __userInfoRawResponse, tokenData.type, termsLink]);

  const inProgress = isPending || isSuccess || isConfirming || isConfirmed || fetcher.state !== "idle";

  const deploymentStatus = useMemo(() => {
    let progress = 0;
    let message = "Not started";
    if (isSuccess) { // tx signed
      progress += 33.4;
      message = "Tx signed";
    }
    else if (isPending) { // waiting for tx signature
      progress += 16.7;
      message = "Waiting for tx signature...";
    }
    
    if (isConfirmed) { // tx confirmed
      progress += 33.4;
      message = "Tx confirmed";
    }
    else if (isConfirming) { // waiting for tx confirmation
      progress += 16.7;
      message = "Waiting for tx confirmation...";
    }

    if (fetcher.data) { // saved
      progress += 33.4;
      message = "Finished";
    }
    else if (fetcher.state !== "idle") { // saving
      progress += 16.7;
      message = "Saving to database...";
    }

    if (progress >= 99) {
      progress = 100;
    }

    return { progress, message };
  }, [isSuccess, isPending, isConfirmed, fetcher.data]);

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
      <div className="flex-1 flex flex-col w-full items-center overflow-x-hidden overflow-y-auto">
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
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">If terms need to be accepted for claiming, enter the link here</legend>
            <input
              type="text"
              className="input w-[calc(100%-0.5rem)] ml-1"
              id="termsLink"
              value={termsLink || ''}
              onChange={(e) => setTermsLink(e.target.value)}
            />
            {!!termsLink && !termsLink.match(/^https?:\/\/[^\/]+\.[^\/]+/) && <p className="text-sm text-orange-400">Please make sure the link starts with https:// and is valid.</p>}
          </fieldset>
          {error && <CollapsedError error={error} />}
          <div className="w-md max-w-md">
            <label className="text-sm font-medium text-gray-500">Deployment status</label>
            <div className="wrap-anywhere">
              <div className="flex flex-col items-center">
                <div className="flex flex-row items-center justify-start w-full">
                  {deploymentStatus.message}
                </div>
                {deploymentStatus.progress > 0
                  ? <progress value={deploymentStatus.progress} max="100" className="progress progress-primary w-full max-w-full" />
                  : <div className="h-2 w-full" />
                }
              </div>
            </div>
          </div>
          <div className="w-[calc(100%-0.5rem)] ml-1 max-w-[calc(100%-0.5rem)] mt-4">
            <TokenMetadataDisplay
              tokenData={vestingData?.tokenData}
              chainId={vestingData?.chainId}
              tokenAddress={vestingData?.tokenAddress}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 m-4">
        {transactionConfirmations !== undefined && (
          <div className="text-xs">
            Transaction confirmations: {transactionConfirmations.toString()}
          </div>
        )}
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
            onClick={() => navigate(`/vestings/${fetcher.data.vestingId}`)}
          >Finish</button>
        )}
      </div>
    </div>
  );
}