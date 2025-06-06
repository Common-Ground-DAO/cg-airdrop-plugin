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
  tokenData?: TokenData;
}

const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

export default function AirdropCreate() {
  const [step, setStep] = useState(0);
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null);
  const { chain } = useAccount();
  const [airdropData, setAirdropData] = useState<AirdropData>({ chainId: chain?.id });

  useEffect(() => {
    if (chain?.id !== airdropData.chainId) {
      if (step !== 0) {
        setStep(0);
      }
      setAirdropData(old => ({
        ...old,
        chainId: chain?.id,
        tokenAddress: undefined,
        tokenData: undefined,
      }));
    }
  }, [chain, airdropData.chainId, step]);

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
    <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
      <h1 className="text-xl font-bold p-4 pb-0">Create Airdrop</h1>
      <ul className="steps w-md mb-4 mx-auto">
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
    </div>
  );
}