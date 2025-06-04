import { useEffect, useMemo, useState } from "react";
import type { CsvUploadResult } from "../csv-upload-button/csv-upload-button";
import { useAccount } from "wagmi";
import { AirdropSetupStepOne, AirdropSetupStepThree, AirdropSetupStepTwo } from "./steps";
import { useTokenData, type TokenData } from "~/hooks/token-data";
import { useNavigate } from "react-router";
import { IoArrowBack } from "react-icons/io5";

export interface AirdropData {
  name?: string;
  tokenAddress?: `0x${string}`;
  chainId?: number;
  chainName?: string;
  tokenData?: TokenData;
}

const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

export default function AirdropCreate() {
  const [step, setStep] = useState(0);
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null);
  const { chain } = useAccount();
  const [airdropData, setAirdropData] = useState<AirdropData>({ chainId: chain?.id, chainName: chain?.name });
  const navigate = useNavigate();

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

  const validAddress = useMemo(() => {
    if (addressRegex.test(airdropData.tokenAddress || "")) {
      return airdropData.tokenAddress as `0x${string}`;
    }
    return undefined;
  }, [airdropData.tokenAddress]);

  const tokenData = useTokenData(validAddress, chain?.id);

  useEffect(() => {
    setAirdropData(old => ({ ...old, tokenData }));
  }, [tokenData]);

  return (
    <div className="h-[calc(100%-1rem)] max-h-[calc(100%-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] mr-4 mb-4">
      <div className="flex flex-col card bg-base-100 items-center h-full pt-4 pb-2 shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Create Airdrop</h1>
        <ul className="steps w-md mb-4">
          <li className={`step ${step >= 0 ? "step-primary" : ""}`}>Airdrop Details</li>
          <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Upload CSV</li>
          <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Deploy</li>
        </ul>
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          {step === 0 && <AirdropSetupStepOne
            airdropData={airdropData}
            setAirdropData={setAirdropData}
            setStep={setStep}
            validAddress={validAddress}
          />}
          {step === 1 && <AirdropSetupStepTwo
            airdropData={airdropData}
            csvResult={csvResult}
            setCsvResult={setCsvResult}
            setStep={setStep}
          />}
          {step === 2 && <AirdropSetupStepThree
            airdropData={airdropData}
            csvResult={csvResult!}
            setStep={setStep}
          />}
        </div>
        <div className="absolute left-4 top-4">
          <button className="btn btn-ghost btn-circle" onClick={() => navigate("/")}><IoArrowBack className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}