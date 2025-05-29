import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import type { erc20Abi } from "viem";
import type { AirdropClaim__factory, ERC20__factory } from "~/contracts";
import type { lsp7DigitalAssetAbi, lsp4DigitalAssetMetadataAbi } from "@lukso/lsp-smart-contracts/abi";
import { INTERFACE_IDS, INTERFACE_ID_LSP7_PREVIOUS } from "@lukso/lsp-smart-contracts/constants";

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
export function useErc20Abi() {
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

    return abi;
}

let _lsp7Abi: typeof lsp7DigitalAssetAbi | null = null;
export function useLsp7Abi() {
    const [abi, setAbi] = useState<typeof lsp7DigitalAssetAbi | null>(_lsp7Abi);
    
    useEffect(() => {
        if (abi) return;
        let mounted = true;
        (async () => {
            const { lsp7DigitalAssetAbi } = await import("@lukso/lsp-smart-contracts/abi");
            _lsp7Abi = lsp7DigitalAssetAbi;
            if (mounted) {
                setAbi(lsp7DigitalAssetAbi);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return abi;
}

let _lsp4Abi: typeof lsp4DigitalAssetMetadataAbi | null = null;
export function useLsp4Abi() {
    const [abi, setAbi] = useState<typeof lsp4DigitalAssetMetadataAbi | null>(_lsp4Abi);
    
    useEffect(() => {
        if (abi) return;
        let mounted = true;
        (async () => {
            const { lsp4DigitalAssetMetadataAbi } = await import("@lukso/lsp-smart-contracts/abi");
            _lsp4Abi = lsp4DigitalAssetMetadataAbi;
            if (mounted) {
                setAbi(lsp4DigitalAssetMetadataAbi);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return abi;
}

export function useErc20Data(address?: `0x${string}`, chainId?: number) {
    const erc20Abi = useErc20Abi();
    const lsp7Abi = useLsp7Abi();

    const { data: isERC165, isFetching: isFetchingIsERC165, error: errorIsERC165 } = useReadContract({
        address,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: ["0x01ffc9a7"],
    });

    const { data: isLSP7_current, isFetching: isFetchingIsLSP7_current, error: errorIsLSP7_current } = useReadContract({
        address,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [INTERFACE_IDS.LSP7DigitalAsset],
    });

    const { data: isLSP7_v0_12_0, isFetching: isFetchingIsLSP7_v0_12_0, error: errorIsLSP7_v0_12_0 } = useReadContract({
        address,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [INTERFACE_ID_LSP7_PREVIOUS["v0.12.0"] as `0x${string}`],
    });

    const { data: isLSP7_v0_14_0, isFetching: isFetchingIsLSP7_v0_14_0, error: errorIsLSP7_v0_14_0 } = useReadContract({
        address,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [INTERFACE_ID_LSP7_PREVIOUS["v0.14.0"] as `0x${string}`],
    });

    const { data: decimals, isFetching: isFetchingDecimals, error: errorDecimals } = useReadContract({
        address,
        abi: erc20Abi || [],
        functionName: "decimals",
        chainId,
    });

    const { data: name, isFetching: isFetchingName, error: errorName } = useReadContract({
        address,
        abi: erc20Abi || [],
        functionName: "name",
        chainId,
    });
    
    const { data: symbol, isFetching: isFetchingSymbol, error: errorSymbol } = useReadContract({
        address,
        abi: erc20Abi || [],
        functionName: "symbol",
        chainId,
    });

    const isFetching = isFetchingDecimals || isFetchingName || isFetchingSymbol;
    const error = errorDecimals || errorName || errorSymbol;

    return { decimals, name, symbol, isFetching, error };
}

export function analyzeContract(address?: `0x${string}`, chainId?: number) {
    const erc20Abi = useErc20Abi();
    const lsp7Abi = useLsp7Abi();

    const { data: decimals, isFetching: isFetchingDecimals, error: errorDecimals } = useReadContract({
        address,
        abi: erc20Abi || [],
        functionName: "decimals",
        chainId,
    });
}