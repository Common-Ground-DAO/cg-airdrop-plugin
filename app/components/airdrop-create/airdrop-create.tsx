import { useCallback, useEffect, useMemo, useState } from "react";
import { useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";
import { useAirdropContractFactory, useErc20Abi } from "~/hooks/contractFactories";
import CsvUploadButton, { type CsvUploadResult } from "../csv-upload-button/csv-upload-button";
import { useAccount, useReadContract } from "wagmi";
import FormatUnits from "../format-units/format-units";
import { TbInfoCircle, TbPlugConnected } from "react-icons/tb";

interface AirdropData {
  name?: string;
  erc20Address?: `0x${string}`;
  decimals?: number;
  tokenName?: string;
  tokenSymbol?: string;
  chainId?: number;
  chainName?: string;
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
  const { chain } = useAccount();

  const handleCsvUpload = useCallback((result: CsvUploadResult) => {
    setCsvResult(result);
    setStep(1);
  }, []);

  useEffect(() => {
    if (chain?.id !== airdropData.chainId || chain?.name !== airdropData.chainName) {
      if (step !== 0) {
        setStep(0);
      }
      setAirdropData(old => ({ ...old, chainId: chain?.id, chainName: chain?.name, erc20Address: undefined }));
    }
  }, [chain, airdropData.chainId, airdropData.chainName, step]);

  return (
    <div className="p-4 h-full flex flex-col card bg-base-100 items-center">
      <h1 className="text-3xl font-bold mb-4">Create Airdrop</h1>
      <ul className="steps w-md mb-4">
        <li className={`step ${step >= 0 ? "step-primary" : ""}`}>Airdrop Details</li>
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Upload CSV</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Deploy</li>
      </ul>
      <div className="flex-1 flex flex-col overflow-hidden">
        {step === 0 && <AirdropSetupStepOne airdropData={airdropData} setAirdropData={setAirdropData} setStep={setStep} />}
        {step === 1 && <AirdropSetupStepTwo csvResult={csvResult!} setStep={setStep} handleCsvUpload={handleCsvUpload} airdropData={airdropData} />}
        {step === 2 && <AirdropSetupStepThree airdropData={airdropData} csvResult={csvResult!} setStep={setStep} />}
      </div>
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
  airdropData: AirdropData;
}

interface StepThreeProps {
  airdropData: AirdropData;
  csvResult: CsvUploadResult;
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
    setAirdropData(old => ({ ...old, erc20Address: value as `0x${string}` }));
  }, [airdropData, setAirdropData]);

  const { data: decimals, isFetching: isFetchingDecimals, error: errorDecimals } = useReadContract({
    address: validAddress,
    abi: erc20abi || [],
    functionName: "decimals",
  });

  const { data: tokenName, isFetching: isFetchingTokenName, error: errorTokenName } = useReadContract({
    address: validAddress,
    abi: erc20abi || [],
    functionName: "name",
  });

  const { data: tokenSymbol, isFetching: isFetchingTokenSymbol, error: errorTokenSymbol } = useReadContract({
    address: validAddress,
    abi: erc20abi || [],
    functionName: "symbol",
  });

  const isFetching = isFetchingDecimals || isFetchingTokenName || isFetchingTokenSymbol;
  const error = errorDecimals || errorTokenName || errorTokenSymbol;

  useEffect(() => {
    if (typeof decimals === "number") {
      if (typeof tokenName === "string" && typeof tokenSymbol === "string") {
        setAirdropData(old => ({ ...old, decimals, tokenName, tokenSymbol }));
      } else {
        setAirdropData(old => ({ ...old, decimals }));
      }
    }
  }, [decimals, tokenName, tokenSymbol]);

  const canProceed = useMemo(() => {
    return !!airdropData.name && !!airdropData.erc20Address && typeof airdropData.decimals === "number";
  }, [airdropData]);

  return <div className="flex flex-col grow justify-start w-full px-2">
    <div className="flex flex-col grow gap-4 max-w-md w-md mx-auto items-center">
      {!isConnected && <div role="alert" className="alert alert-error mt-4">
        <TbPlugConnected className="w-6 h-6" />
        <span>Please connect your wallet to continue.</span>
      </div>}
      {isConnected && <>
        <p>Enter a name for your airdrop and the address of the ERC20 contract you want to airdrop.</p>
        <p className="alert alert-info text-xs w-full p-2">
          <TbInfoCircle className="w-4 h-4" />
          <span>You can change chain and address in your wallet app.</span>
        </p>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Airdrop Title for your community</legend>
          <input
            type="text"
            className="input w-full"
            id="name"
            value={airdropData.name || ''}
            onChange={(e) => setAirdropData(old => ({ ...old, name: e.target.value }))}
          />
        </fieldset>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">ERC20 Contract Address on {chain?.name || "unknown"}</legend>
          <input
            type="text"
            className="input w-full"
            id="erc20Address"
            value={airdropData.erc20Address || ''}
            onChange={(e) => setAddress(e.target.value)}
          />
          {addressWarning && <p className="text-sm text-orange-400">{addressWarning}</p>}
        </fieldset>
        {error && <p className="text-sm text-red-400 max-h-28 text-ellipsis overflow-hidden">{error.message}</p>}
        <div className="flex flex-col items-center gap-2 mt-auto">
          <TokenInfo tokenName={airdropData.tokenName} tokenSymbol={airdropData.tokenSymbol} decimals={airdropData.decimals} />
          <button
            className="btn btn-primary"
            onClick={() => setStep(1)}
            disabled={!canProceed}
          >{isFetching ? "Checking..." : canProceed ? "Next" : "Fields missing"}</button>
        </div>
      </>}
    </div>
  </div>;
};

const AirdropSetupStepTwo = ({ csvResult, handleCsvUpload, setStep, airdropData }: StepTwoProps) => {
  return <div className="h-full flex flex-col items-center">
    <div className="flex flex-col mb-4 items-center max-w-md">
      {!csvResult && <><p className="text-xs text-gray-500">Decimals detected from contract: {airdropData.decimals || "unknown. This means something went wrong with the contract."}</p>
        <p>Upload a CSV file to get started. It must contain address and uint256 values and has to be formatted like this:</p>
        <div className="card font-mono p-2 my-4 bg-white text-black text-sm whitespace-nowrap">
          "address","amount"<br/>
          "0x1234567890123456789012345678901234567890","100"<br/>
          "0x1234567890123456789012345678901234567891","200"
        </div>
      </>}
      {!!csvResult && <p>CSV upload successful.</p>}
    </div>
    
    {!!csvResult && (
      <div className="flex-1 overflow-auto mb-4 bg-white rounded-lg border border-base-300">
        <table className="table w-full font-mono text-black text-xs">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="p-2 border-b">Address</th>
              <th className="p-2 border-b">Amount</th>
            </tr>
          </thead>  
          <tbody>
            {csvResult.rows.map((row, index) => (
              <tr key={index}>
                <td className={`p-2 ${index === csvResult.rows.length - 1 ? "" : "border-b"}`}>{row[0]}</td>
                <td className={`p-2 ${index === csvResult.rows.length - 1 ? "" : "border-b"}`}>
                  <FormatUnits value={row[1]} decimals={airdropData.decimals || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    
    <div className="flex flex-col items-center gap-2 mt-auto">
      <TokenInfo tokenName={airdropData.tokenName} tokenSymbol={airdropData.tokenSymbol} decimals={airdropData.decimals} />
      <div className="flex flex-row gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setStep(0)}
        >Back</button>
        <CsvUploadButton
          text={`Upload${!!csvResult ? " new" : ""} CSV`}
          onUpload={handleCsvUpload}
        />
        <button
          className="btn btn-primary"
          onClick={() => setStep(2)}
          disabled={!csvResult}
        >Next</button>
      </div>
    </div>
  </div>;
};

const AirdropSetupStepThree = ({ csvResult, airdropData, setStep }: StepThreeProps) => {
  const { communityInfo, userInfo } = useCgData();
  const submit = useSubmit();

  const handleCreateAirdrop = useCallback(() => {
    if (!communityInfo || !userInfo) return;
    
    const formData = new FormData();
    formData.append("name", airdropData.name!);
    formData.append("creatorId", userInfo.id);
    formData.append("communityId", communityInfo.id);
    formData.append("erc20Address", airdropData.erc20Address!);
    formData.append("airdropAddress", "0x1234567890123456789012345678901234567890"); // Todo
    formData.append("chainId", airdropData.chainId!.toString());
    formData.append("chainName", airdropData.chainName!);
    formData.append("items", JSON.stringify(
      csvResult.rows.map(row => ({ address: row[0], amount: row[1] }))
    ));

    submit(formData, { method: "post", action: "/api/airdrop/create", navigate: false });
  }, [communityInfo, userInfo, submit]);

  return <div className="h-full flex flex-col items-center justify-start w-full px-2">
    <div className="flex flex-col grow gap-4 max-w-md w-md mx-auto items-center">
      <p>You are about to create an airdrop for {airdropData.name} on {airdropData.chainName}.</p>
      <p>The ERC20 contract address is {airdropData.erc20Address}.</p>
    </div>
    <div className="flex flex-col items-center gap-2 mt-auto">
      <TokenInfo tokenName={airdropData.tokenName} tokenSymbol={airdropData.tokenSymbol} decimals={airdropData.decimals} />
      <div className="flex flex-row gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setStep(1)}
        >Back</button>
        <button
          className="btn btn-primary"
          onClick={handleCreateAirdrop}
        >Create Airdrop</button>
      </div>
    </div>
  </div>;
};

const TokenInfo = ({ tokenName, tokenSymbol, decimals }: { tokenName?: string, tokenSymbol?: string, decimals?: number }) => {
  return <div className="flex flex-row gap-4 text-xs text-gray-500">
    <span>Name: {tokenName || "-"}</span>
    <span>Symbol: {tokenSymbol || "-"}</span>
    <span>Decimals: {decimals || "-"}</span>
  </div>;
};