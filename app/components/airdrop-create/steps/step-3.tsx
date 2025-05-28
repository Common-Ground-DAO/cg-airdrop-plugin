import React, { useCallback, useMemo, useRef, useState } from "react";
import { useFetcher, useNavigate, useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import { useAirdropContractFactory } from "~/hooks";
import type { CsvUploadResult } from "../../csv-upload-button/csv-upload-button";
import { useDeployContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import type { AirdropData } from "../airdrop-create";
import { TokenInfo } from ".";
import { FaRegCircle, FaRegCircleCheck } from "react-icons/fa6";
import { PiSpinnerBold } from "react-icons/pi";
import { MdErrorOutline } from "react-icons/md";

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
    formData.append("erc20Address", airdropData.erc20Address!);
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
      args: [airdropData.erc20Address!, csvResult.tree.root as `0x${string}`],
      chainId: airdropData.chainId,
    }, {
      onError(error) {
        setError("Error deploying airdrop contract: " + error.message);
        console.error("Error deploying airdrop contract", error);
      },
    });
  }, [communityInfo, userInfo, airdropData, csvResult, deployContract, factory]);

  const inProgress = isPending || isSuccess || isConfirming || isConfirmed || fetcher.state !== "idle";

  return <div className="h-full flex flex-col items-center justify-start w-full px-2">
    <div className="flex flex-col grow gap-4 max-w-md w-md items-center">
      <p>You are about to create an airdrop for {airdropData.name} on {airdropData.chainName}.</p>
      <div className="card card-xs bg-base-300">
        <div className="card-body">
          <table className="table table-xs wrap-anywhere">
            <tbody>
              <tr>
                <td colSpan={2}>
                  <p className="w-full text-center text-sm mb-2 font-bold opacity-60">Airdrop Details</p>
                </td>
              </tr>
              <tr>
                <td>Name</td>
                <td>{airdropData.name}</td>
              </tr>
              <tr>
                <td>ERC20 Address</td>
                <td>{airdropData.erc20Address}</td>
              </tr>
              <tr>
                <td>Chain</td>
                <td>{airdropData.chainName} (chainId: {airdropData.chainId})</td>
              </tr>
              <tr>
                <td>Merkle Root</td>
                <td>{csvResult.tree.root}</td>
              </tr>
              <tr>
                <td>Decimals</td>
                <td>{airdropData.decimals}</td>
              </tr>
              <tr>
                <td>Contract Address</td>
                <td>{receipt?.contractAddress || "Not deployed yet"}</td>
              </tr>
              <tr>
                <td>Deployment Tx</td>
                <td>{txHash || "Not deployed yet"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div role="alert" className="alert alert-info">
        <div className="flex flex-col items-start gap-2 col-span-2">
          <div className="font-bold w-full text-center">Status</div>
          <div className="flex flex-row items-center gap-2">
            {isSuccess ? <FaRegCircleCheck /> : isPending ? <PiSpinnerBold className="animate-spin" /> : <FaRegCircle />}
            <span>Sign Transaction</span>
          </div>
          <div className="flex flex-row items-center gap-2">
            {isConfirmed ? <FaRegCircleCheck /> : isConfirming ? <PiSpinnerBold className="animate-spin" /> : <FaRegCircle />}
            <span>Wait for deployment</span>
          </div>
          <div className="flex flex-row items-center gap-2">
            {fetcher.data ? <FaRegCircleCheck /> : fetcher.state !== "idle" ? <PiSpinnerBold className="animate-spin" /> : <FaRegCircle />}
            <span>Save in database</span>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-error"><MdErrorOutline />{error}</div>}
    </div>
    <div className="flex flex-col items-center gap-2 mt-auto">
      <TokenInfo tokenName={airdropData.tokenName} tokenSymbol={airdropData.tokenSymbol} decimals={airdropData.decimals} />
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