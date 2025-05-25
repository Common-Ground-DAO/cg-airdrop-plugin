import React, { useCallback, useState } from "react";
import { useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import { useAirdropContractFactory } from "~/hooks/contractFactories";
import type { CsvUploadResult } from "../../csv-upload-button/csv-upload-button";
import { useDeployContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import type { AirdropData } from "../airdrop-create";
import { TokenInfo } from ".";

interface StepThreeProps {
  airdropData: AirdropData;
  csvResult: CsvUploadResult;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const AirdropSetupStepThree = ({ csvResult, airdropData, setStep }: StepThreeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { communityInfo, userInfo } = useCgData();
  const submit = useSubmit();
  const factory = useAirdropContractFactory();
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
    formData.append("items", JSON.stringify(
      csvResult.rows.map(row => ({ address: row[0], amount: row[1] }))
    ));

    try {
      setIsSubmitting(true);
      await submit(formData, { method: "post", action: "/api/airdrop/create", navigate: false });
    } catch (error) {
      console.error("Error submitting airdrop to database", error);
      setError("Error submitting airdrop to database");
    } finally {
      setIsSubmitting(false);
    }
  }, [communityInfo, userInfo, submit, airdropData, csvResult]);

  // Effect to handle successful deployment
  React.useEffect(() => {
    if (isConfirmed && receipt?.contractAddress && merkleRoot === csvResult.tree.root) {
      handleSubmitToDatabase(receipt.contractAddress);
    }
  }, [isConfirmed, receipt?.contractAddress, handleSubmitToDatabase, merkleRoot, csvResult.tree.root]);

  const handleCreateAirdrop = useCallback(() => {
    if (!communityInfo || !userInfo || !factory) return;

    deployContract({
      abi: factory.abi,
      bytecode: factory.bytecode,
      args: [airdropData.erc20Address!, csvResult.tree.root as `0x${string}`],
      chainId: airdropData.chainId,
    }, {
      onError(error, variables, context) {
        console.error("Error deploying airdrop contract", error);
      },
      onSuccess(data, variables, context) {
        console.log("Airdrop contract deployment transaction sent", data, variables, context);
      },
      onSettled(data, error, variables, context) {
        console.log("Airdrop contract deployment settled", data, error, variables, context);
      },
    });
  }, [communityInfo, userInfo, airdropData, csvResult, deployContract, factory]);

  return <div className="h-full flex flex-col items-center justify-start w-full px-2">
    <div className="flex flex-col grow gap-4 max-w-md w-md mx-auto items-center">
      <p>You are about to create an airdrop for {airdropData.name} on {airdropData.chainName}.</p>
      <p>The ERC20 contract address is {airdropData.erc20Address}.</p>
      {txHash && (
        <div className="text-sm text-gray-600">
          <p>Transaction Hash: {txHash}</p>
          {isConfirming && <p>Waiting for confirmation...</p>}
          {isConfirmed && receipt?.contractAddress && (
            <p>Contract deployed at: {receipt.contractAddress}</p>
          )}
        </div>
      )}
    </div>
    <div className="flex flex-col items-center gap-2 mt-auto">
      <TokenInfo tokenName={airdropData.tokenName} tokenSymbol={airdropData.tokenSymbol} decimals={airdropData.decimals} />
      <div className="flex flex-row gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setStep(1)}
          disabled={isPending || isConfirming}
        >Back</button>
        <button
          className="btn btn-primary"
          onClick={handleCreateAirdrop}
          disabled={isPending || isConfirming}
        >
          {isPending ? "Deploying..." : isConfirming ? "Confirming..." : "Create Airdrop"}
        </button>
      </div>
    </div>
  </div>;
};

export default AirdropSetupStepThree;