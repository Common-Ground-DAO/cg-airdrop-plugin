import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import type { erc20Abi } from "viem";
import type { AirdropClaim__factory, ERC20__factory } from "~/contracts";

let _airdropFactory: typeof AirdropClaim__factory | null = null;
let _erc20Factory: typeof ERC20__factory | null = null;

// Airdrop

export function useAirdropContractFactory() {
    const [factory, setFactory] = useState<typeof AirdropClaim__factory | null>(() => _airdropFactory);
    
    useEffect(() => {
        let mounted = true;
        if (factory) return;
        (async () => {
            const { AirdropClaim__factory } = await import("~/contracts/factories/contracts/AirdropClaim__factory");
            _airdropFactory = AirdropClaim__factory;
            if (mounted) {
                setFactory(() => AirdropClaim__factory);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return factory;
}

export function useAirdropAbi() {
    const airdropContractFactory = useAirdropContractFactory();
    const [abi, setAbi] = useState<typeof AirdropClaim__factory["abi"] | null>(airdropContractFactory?.abi || null);

    useEffect(() => {
        if (!abi && airdropContractFactory) {
            setAbi(airdropContractFactory.abi);
        }
    }, [abi, airdropContractFactory]);

    return abi;
}

// ERC20

export function useErc20ContractFactory() {
    const [factory, setFactory] = useState<typeof ERC20__factory | null>(() => _erc20Factory);
    
    useEffect(() => {
        let mounted = true;
        if (factory) return;
        (async () => {
            const { ERC20__factory } = await import("~/contracts/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory");
            _erc20Factory = ERC20__factory;
            if (mounted) {
                setFactory(() => ERC20__factory);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return factory;
}

let _erc20Abi: typeof erc20Abi | null = null;
export function useErc20Data(address?: `0x${string}`, chainId?: number) {
    const [abi, setAbi] = useState<typeof erc20Abi | null>(_erc20Abi);

    useEffect(() => {
        if (abi) return;
        let mounted = true;
        (async () => {
            const { erc20Abi } = await import("viem");
            _erc20Abi = erc20Abi;
            if (mounted) {
                setAbi(erc20Abi);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);
    
    const { data: decimals, isFetching: isFetchingDecimals, error: errorDecimals } = useReadContract({
        address,
        abi: abi || [],
        functionName: "decimals",
        chainId,
    });

    const { data: name, isFetching: isFetchingName, error: errorName } = useReadContract({
        address,
        abi: abi || [],
        functionName: "name",
        chainId,
    });
    
    const { data: symbol, isFetching: isFetchingSymbol, error: errorSymbol } = useReadContract({
        address,
        abi: abi || [],
        functionName: "symbol",
        chainId,
    });

    const isFetching = isFetchingDecimals || isFetchingName || isFetchingSymbol;
    const error = errorDecimals || errorName || errorSymbol;

    return { decimals, name, symbol, isFetching, error };
}