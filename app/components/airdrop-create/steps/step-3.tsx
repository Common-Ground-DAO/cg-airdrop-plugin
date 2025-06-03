import React, { useCallback, useMemo, useRef, useState } from "react";
import { useFetcher, useNavigate, useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import { useAirdropContractFactory } from "~/hooks";
import type { CsvUploadResult } from "../../csv-upload-button/csv-upload-button";
import { useDeployContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import type { AirdropData } from "../airdrop-create";
import { FaRegCircle, FaRegCircleCheck } from "react-icons/fa6";
import { PiSpinnerBold } from "react-icons/pi";
import TokenMetadataDisplay from "~/components/token-metadata-display";

interface StepThreeProps {
  airdropData: AirdropData;
  csvResult: CsvUploadResult;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const AirdropSetupStepThree = ({ csvResult, airdropData, setStep }: StepThreeProps) => {
  const [error, setError] = useState<string | null>(null);
  const { communityInfo, userInfo, __communityInfoRawResponse, __userInfoRawResponse } = useCgData();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const factory = useAirdropContractFactory();
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

  const { data: merkleRoot } = useReadContract({
    address: receipt?.contractAddress || undefined,
    abi: factory?.abi,
    functionName: "merkleRoot",
    chainId: airdropData.chainId,
  });

  // Submit to database when we have the contract address
  const handleSubmitToDatabase = useCallback(async (contractAddress: string) => {
    if (!communityInfo || !userInfo) return;

    console.log("Submitting airdrop to database with contract address:", contractAddress);

    const formData = new FormData();
    formData.append("name", airdropData.name!);
    formData.append("creatorId", userInfo.id);
    formData.append("communityId", communityInfo.id);
    formData.append("tokenAddress", airdropData.tokenAddress!);
    formData.append("airdropAddress", contractAddress);
    formData.append("chainId", airdropData.chainId!.toString());
    formData.append("chainName", airdropData.chainName!);
    formData.append("communityInfoRaw", __communityInfoRawResponse!);
    formData.append("userInfoRaw", __userInfoRawResponse!);
    formData.append("items", JSON.stringify(
      csvResult.rows.map(row => ({ address: row[0], amount: row[1] }))
    ));
    formData.append("tree", JSON.stringify(csvResult.tree.dump()));

    try {
      await fetcher.submit(formData, { method: "post", action: "/api/airdrop/create" });
    } catch (error) {
      console.error("Error submitting airdrop to database", error);
      setError("Error submitting airdrop to database");
    }
  }, [communityInfo, userInfo, submit, airdropData, csvResult]);

  // Effect to handle successful deployment
  React.useEffect(() => {
    if (isConfirmed && receipt?.contractAddress && merkleRoot === csvResult.tree.root) {
      if (!submitTriggered.current) {
        submitTriggered.current = true;
        handleSubmitToDatabase(receipt.contractAddress);
      }
    }
  }, [isConfirmed, receipt?.contractAddress, handleSubmitToDatabase, merkleRoot, csvResult.tree.root]);

  const handleCreateAirdrop = useCallback(() => {
    if (!communityInfo || !userInfo || !factory) return;
    setError(null);

    deployContract({
      abi: factory.abi,
      bytecode: factory.bytecode,
      args: [airdropData.tokenAddress!, csvResult.tree.root as `0x${string}`],
      chainId: airdropData.chainId,
    }, {
      onError(error) {
        setError("Error deploying airdrop contract: " + error.message);
        console.error("Error deploying airdrop contract", error);
      },
    });
  }, [communityInfo, userInfo, airdropData, csvResult, deployContract, factory]);

  const inProgress = isPending || isSuccess || isConfirming || isConfirmed || fetcher.state !== "idle";

  const { dataUri, downloadFileName } = useMemo(() => {
    const treeData = {
      rows: csvResult.rows,
      tree: csvResult.tree.dump()
    };
    
    const dataStr = JSON.stringify(treeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ dataStr;
    const downloadFileName = `${airdropData.name || 'airdrop'}.json`;
    return { dataUri, downloadFileName };
  }, [csvResult, airdropData.name]);

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

  return <div className="h-full flex flex-col items-center justify-start w-full px-2">
    <div className="flex flex-col flex-1 w-full items-center overflow-auto">
      <div className="flex flex-col grow gap-4 max-w-md w-md items-center flex-1">
        <p>You are about to create an airdrop <b>{airdropData.name}</b> on <b>{airdropData.chainName}</b>.</p>
        <div className="card bg-base-300 w-full max-w-full">
          <div className="card-body">
            <div className="card-title">Airdrop Details</div>

            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <div className="">
                {airdropData.name}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Merkle Root</label>
              <div className="wrap-anywhere">
                {csvResult.tree.root}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Deployment status</label>
              <div className="wrap-anywhere">
                <div className="flex flex-col items-center">
                  <div className="flex flex-row items-center justify-start w-full text-xs">
                    {deploymentStatus.message}
                  </div>
                  {deploymentStatus.progress > 0
                    ? <progress value={deploymentStatus.progress} max="100" className="progress progress-primary w-full max-w-full" />
                    : <div className="h-2 w-full" />
                  }
                </div>
              </div>
            </div>

            <div className="mt-2">
              <a
                className="btn btn-outline btn-sm"
                href={dataUri}
                download={downloadFileName}
              >
                Download Tree Data
              </a>
            </div>
            
          </div>
        </div>
        <div className="text-xl font-bold">
          Airdropped token information
        </div>
        <TokenMetadataDisplay
          tokenData={airdropData.tokenData}
          chainName={airdropData.chainName}
          tokenAddress={airdropData.tokenAddress}
        />
        {error && (
          <div className="collapse collapse-arrow bg-error border-base-300 border grid-cols-[100%]">
            <input type="checkbox" />
            <div className="collapse-title font-semibold">
              Error
            </div>
            <div className="collapse-content text-sm">
              <div className="max-w-full wrap-break-word">
                {error}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="flex flex-col items-center gap-2 pt-4 mt-auto mb-2">
      <div className="flex flex-row gap-2">
        {!inProgress && <>
          <button
            className="btn btn-primary"
            onClick={() => setStep(1)}
          >Back</button>
          <button
            className="btn btn-primary"
            onClick={handleCreateAirdrop}
          >
            Deploy Airdrop
          </button>
        </>}
        {inProgress && !fetcher.data && (
          <button
            className="btn btn-primary"
            disabled
          >
            Deploying...
          </button>
        )}
        {fetcher.data && (
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/${fetcher.data.airdropId}`)}
          >Finish</button>
        )}
      </div>
    </div>
  </div>;
};

export default AirdropSetupStepThree;