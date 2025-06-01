import { useEffect, useState } from "react";
import type { CsvUploadResult } from "../csv-upload-button/csv-upload-button";
import { useAccount } from "wagmi";
import { AirdropSetupStepOne, AirdropSetupStepThree, AirdropSetupStepTwo } from "./steps";
import type { TokenData } from "~/hooks/token-data";

export interface AirdropData {
  name?: string;
  tokenAddress?: `0x${string}`;
  chainId?: number;
  chainName?: string;
  tokenData?: TokenData;
}

export default function AirdropCreate() {
  const [step, setStep] = useState(0);
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null);
  const { chain } = useAccount();
  const [airdropData, setAirdropData] = useState<AirdropData>({ chainId: chain?.id, chainName: chain?.name });

  useEffect(() => {
    if (chain?.id !== airdropData.chainId || chain?.name !== airdropData.chainName) {
      if (step !== 0) {
        setStep(0);
      }
      setAirdropData(old => ({
        ...old,
        chainId: chain?.id,
        chainName: chain?.name,
        tokenAddress: undefined,
        tokenData: undefined,
      }));
    }
  }, [chain, airdropData.chainId, airdropData.chainName, step]);

  return (
    <div className="flex flex-col card bg-base-100 items-center h-[calc(100%-1rem)] max-h-[calc(100%-1rem)] mr-4 mb-4 p-4 shadow-md">
      <h1 className="text-3xl font-bold mb-4">Create Airdrop</h1>
      <ul className="steps w-md mb-4">
        <li className={`step ${step >= 0 ? "step-primary" : ""}`}>Airdrop Details</li>
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Upload CSV</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Deploy</li>
      </ul>
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {step === 0 && <AirdropSetupStepOne airdropData={airdropData} setAirdropData={setAirdropData} setStep={setStep} />}
        {step === 1 && <AirdropSetupStepTwo airdropData={airdropData} csvResult={csvResult} setCsvResult={setCsvResult} setStep={setStep} />}
        {step === 2 && <AirdropSetupStepThree airdropData={airdropData} csvResult={csvResult!} setStep={setStep} />}
      </div>
    </div>
  );
}