import { useCallback, useEffect, useMemo, useState } from "react";
import { useErc20Abi } from "~/hooks/contractFactories";
import { useAccount, useDeployContract, useReadContract } from "wagmi";
import type { AirdropData } from "../airdrop-create";
import { TokenInfo } from ".";
import { TbPlugConnected, TbInfoCircle } from "react-icons/tb";

interface StepOneProps {
  airdropData: AirdropData;
  setAirdropData: React.Dispatch<React.SetStateAction<AirdropData>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

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
    chainId: chain?.id,
  });

  const { data: tokenName, isFetching: isFetchingTokenName, error: errorTokenName } = useReadContract({
    address: validAddress,
    abi: erc20abi || [],
    functionName: "name",
    chainId: chain?.id,
  });

  const { data: tokenSymbol, isFetching: isFetchingTokenSymbol, error: errorTokenSymbol } = useReadContract({
    address: validAddress,
    abi: erc20abi || [],
    functionName: "symbol",
    chainId: chain?.id,
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

export default AirdropSetupStepOne;