import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import type { AirdropData } from "../airdrop-create";
import { TbPlugConnected, TbInfoCircle } from "react-icons/tb";
import TokenMetadataDisplay from "~/components/token-metadata-display";
import type { TokenData } from "~/hooks/token-data";

interface StepOneProps {
  airdropData: AirdropData;
  setAirdropData: React.Dispatch<React.SetStateAction<AirdropData>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  validAddress?: `0x${string}` | undefined;
}

const AirdropSetupStepOne = ({ airdropData, setAirdropData, setStep, validAddress }: StepOneProps) => {
  const { isConnected, chain } = useAccount();

  const addressWarning = useMemo(() => {
    if (validAddress || !airdropData.tokenAddress) {
      return null;
    }
    return "Invalid address";
  }, [validAddress, airdropData.tokenAddress]);

  const canProceed = useMemo(() => {
    const { name, tokenAddress, tokenData } = airdropData;

    if (!name || !tokenAddress || !validAddress || !tokenData || tokenData.isFetching || tokenData.type === undefined || typeof tokenData.decimals !== "number") {
      return false;
    }
    if (tokenData.type === "lsp7") {
      return !!tokenData.lsp7Data?.lsp4TokenName && !!tokenData.lsp7Data?.lsp4TokenSymbol && tokenData.lsp7Data?.lsp4TokenType !== undefined;
    }
    if (tokenData.type === "erc20") {
      return !!tokenData.erc20Data?.name && !!tokenData.erc20Data?.symbol;
    }
    
    return true;
  }, [airdropData]);

  const tokenData = airdropData.tokenData;

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
          <legend className="fieldset-legend">Display name for this airdrop</legend>
          <input
            type="text"
            className="input w-[calc(100%-0.5rem)] ml-1"
            id="name"
            value={airdropData.name || ''}
            onChange={(e) => setAirdropData(old => ({ ...old, name: e.target.value }))}
          />
        </fieldset>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Token Address on {chain?.name || "unknown"}</legend>
          <input
            type="text"
            className="input w-[calc(100%-0.5rem)] ml-1"
            id="tokenAddress"
            value={airdropData.tokenAddress || ''}
            onChange={(e) => setAirdropData(old => ({ ...old, tokenAddress: e.target.value as `0x${string}` }))}
          />
          {addressWarning && <p className="text-sm text-orange-400">{addressWarning}</p>}
        </fieldset>
        <div className="w-[calc(100%-0.5rem)] ml-1 max-w-[calc(100%-0.5rem)] mt-4">
          <TokenMetadataDisplay
            tokenData={airdropData.tokenData}
            chainName={airdropData.chainName}
            tokenAddress={airdropData.tokenAddress}
          />
        </div>
        {tokenData?.error && <p className="text-sm text-red-400 max-h-28 text-ellipsis overflow-y-auto">{tokenData.error.message}</p>}
        <div className="flex flex-col items-center gap-2 mt-auto mb-2 max-w-full">
          <button
            className="btn btn-primary"
            onClick={() => setStep(1)}
            disabled={!canProceed}
          >{tokenData?.isFetching ? "Checking..." : canProceed ? "Next" : "Fields missing"}</button>
        </div>
      </>}
    </div>
  </div>;
};

export default AirdropSetupStepOne;