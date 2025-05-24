import { useCallback, useEffect, useMemo, useState } from "react";
import { useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import { useAirdropContractFactory, useErc20Abi, useErc20ContractFactory } from "~/hooks/contractFactories";
import CsvUploadButton, { type CsvUploadResult } from "../csv-upload-button/csv-upload-button";
import { useAccount, useReadContract } from "wagmi";

interface AirdropData {
  name?: string;
  contractAddress?: `0x${string}`;
  decimals?: number;
}

const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

export default function AirdropView() {
  const [step, setStep] = useState(0);
  const { communityInfo, userInfo } = useCgData();
  const submit = useSubmit();
  const factory = useAirdropContractFactory();
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null);
  const [airdropData, setAirdropData] = useState<AirdropData>({});
  const [erc20abi, setErc20Abi] = useState<any[]>([]);
  const airdropContractFactory = useAirdropContractFactory();

  const handleCsvUpload = useCallback((result: CsvUploadResult) => {
    setCsvResult(result);
    setStep(1);
  }, []);

  const handleCreateAirdrop = useCallback(() => {
    if (!communityInfo || !userInfo) return;
    
    const formData = new FormData();
    formData.append("name", "Test Airdrop");
    formData.append("creatorId", userInfo.id);
    formData.append("communityId", communityInfo.id);
    formData.append("contract", "0x0000000000000000000000000000000000000000");
    formData.append("items", JSON.stringify([
      {
        address: "0x0000000000000000000000000000000000000000",
        amount: "100",
      }, 
      {
        address: "0x0000000000000000000000000000000000000001",
        amount: "200",
      }
    ]));

    submit(formData, { method: "post", action: "/api/airdrop/create", navigate: false });
  }, [communityInfo, userInfo, submit]);

  return (
    <div className="px-8 pb-4 flex flex-col gap-4">
      <h1 className="text-3xl font-bold mb-2">Create Airdrop</h1>
      <ul className="steps text-sm">
        <li className={`step ${step >= 0 ? "step-primary" : ""}`}>Upload CSV</li>
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Set up airdrop</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Deploy Contract</li>
      </ul>
      {step === 0 && <AirdropSetupStepOne airdropData={airdropData} setAirdropData={setAirdropData} setStep={setStep} />}
      {step === 1 && <AirdropSetupStepTwo csvResult={csvResult!} setStep={setStep} handleCsvUpload={handleCsvUpload} />}
    </div>
  );
}

interface StepOneProps {
  airdropData: AirdropData;
  setAirdropData: React.Dispatch<React.SetStateAction<AirdropData>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

interface StepTwoProps {
  csvResult: CsvUploadResult | null;
  handleCsvUpload: (result: CsvUploadResult) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const AirdropSetupStepOne = ({ airdropData, setAirdropData, setStep }: StepOneProps) => {
  const { address, isConnected, chain, connector } = useAccount();
  const erc20abi = useErc20Abi();
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  const [validAddress, setValidAddress] = useState<`0x${string}` | undefined>(undefined);

  const setAddress = useCallback((value: string) => {
    value = value.trim();
    if (!addressRegex.test(value)) {
      setValidAddress(undefined);
      setAddressWarning("Invalid address");
    } else {
      setValidAddress(value as `0x${string}`);
      setAddressWarning(null);
    }
    setAirdropData(old => ({ ...old, contractAddress: value as `0x${string}` }));
  }, [airdropData, setAirdropData]);

  const { data: decimals, isFetching, isLoading, isPending, error } = useReadContract({
    address: validAddress,
    abi: erc20abi || [],
    functionName: "decimals",
  });
  console.log("decimals", decimals, isFetching, isLoading, isPending);

  useEffect(() => {
    if (typeof decimals === "number") {
      setAirdropData(old => ({ ...old, decimals }));
    }
  }, [decimals]);

  const canProceed = useMemo(() => {
    return !!airdropData.name && !!airdropData.contractAddress && typeof airdropData.decimals === "number";
  }, [airdropData]);

  return <div className="flex flex-col gap-4 max-w-md w-md">
    <h2 className="text-lg font-bold">Set up airdrop</h2>
    <p>Set up the airdrop details.</p>
    {!isConnected && <div className="alert alert-error">
      <div className="flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Please connect your wallet to continue.</span>
      </div>
    </div>}
    {isConnected && <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Airdrop Title</legend>
        <input
          type="text"
          className="input w-full"
          id="name"
          value={airdropData.name || ''}
          onChange={(e) => setAirdropData(old => ({ ...old, name: e.target.value }))}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">ERC20 Contract Address</legend>
        <input
          type="text"
          className="input w-full"
          id="erc20Address"
          value={airdropData.contractAddress || ''}
          onChange={(e) => setAddress(e.target.value)}
        />
        {addressWarning && <p className="text-sm text-orange-400">{addressWarning}</p>}
      </fieldset>
      {canProceed && <button className="btn btn-primary" onClick={() => setStep(1)}>Next</button>}
    </>}
  </div>;
};

const AirdropSetupStepTwo = ({ csvResult, handleCsvUpload, setStep }: StepTwoProps) => {
  return <div>
    <h2 className="text-lg font-bold">Upload CSV</h2>
    {!csvResult && <>
      <p>Upload a CSV file to get started. It must contain address and uint256 values and has to be formatted like this:</p>
      <div className="card font-mono p-2 my-4 bg-white text-black text-sm whitespace-nowrap overflow-y-auto">
        "address","amount"<br/>
        "0x1234567890123456789012345678901234567890","100"<br/>
        "0x1234567890123456789012345678901234567891","200"
      </div>
    </>}
    {!!csvResult && <>
      <p>CSV file uploaded successfully.</p>
      <div className="card font-mono p-2 my-4 bg-white text-black text-sm whitespace-nowrap overflow-y-auto max-h-[min(400px, 60vh)]">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Address</th>
              <th>Amount</th>
            </tr>
          </thead>  
          <tbody>
            {csvResult.rows.map((row, index) => (
              <tr key={index}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>}
    <div className="flex flex-row gap-2">
      <CsvUploadButton
        text="Upload CSV"
        onUpload={handleCsvUpload}
      />
      {csvResult && <button className="btn btn-primary" onClick={() => setStep(2)}>Next</button>}
    </div>
  </div>;
};