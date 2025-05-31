import { INTERFACE_ID_LSP7, INTERFACE_ID_LSP7_PREVIOUS } from "@lukso/lsp7-contracts/constants";
import { useErc20Abi, useLsp4Abi, useLsp7Abi } from "./contracts";
import { useReadContract, useConnectorClient, usePublicClient } from "wagmi";
import { useEffect, useMemo, useState } from "react";

export interface TokenData {
    isERC165?: boolean;
    type?: "erc20" | "lsp7";
    totalSupply?: bigint;
    decimals?: number;
    erc20Data?: ERC20Data;
    lsp7Data?: LSP7Data;
    isFetching?: boolean;
    error?: any;
}

export interface LSP7Data {
    lsp4TokenName?: string;
    lsp4TokenSymbol?: string;
    lsp4TokenType?: number;
    lsp4Metadata?: any;
    lsp4Creators?: string[];
    errors?: LSP7Errors;
}

interface LSP7Errors {
    lsp4TokenName?: any;
    lsp4TokenSymbol?: any;
    lsp4TokenType?: any;
    lsp4Metadata?: any;
    lsp4Creators?: any;
    otherError?: any;
}

export interface ERC20Data {
    name?: string;
    symbol?: string;
    errors?: ERC20Errors;
}

interface ERC20Errors {
    name?: any;
    symbol?: any;
}

export function useTokenData(address?: `0x${string}`, chainId?: number): TokenData {
    const erc20Abi = useErc20Abi();
    const lsp7Abi = useLsp7Abi();
    // const lsp4Abi = useLsp4Abi();

    const { data: isERC165, isFetching: isFetchingIsERC165, error: errorIsERC165 } = useReadContract({
        address,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: ["0x01ffc9a7"],
    });

    const { data: isLSP7_current, isFetching: isFetchingIsLSP7_current, error: errorIsLSP7_current } = useReadContract({
        address: isERC165 ? address : undefined,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [INTERFACE_ID_LSP7],
    });

    const { data: isLSP7_v0_12_0, isFetching: isFetchingIsLSP7_v0_12_0, error: errorIsLSP7_v0_12_0 } = useReadContract({
        address: isERC165 ? address : undefined,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [INTERFACE_ID_LSP7_PREVIOUS["v0.12.0"] as `0x${string}`],
    });

    const { data: isLSP7_v0_14_0, isFetching: isFetchingIsLSP7_v0_14_0, error: errorIsLSP7_v0_14_0 } = useReadContract({
        address: isERC165 ? address : undefined,
        abi: lsp7Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [INTERFACE_ID_LSP7_PREVIOUS["v0.14.0"] as `0x${string}`],
    });

    const isLSP7 = useMemo(() => {
        // returns whether the contract is LSP7, and undefined while unclear
        if (isLSP7_current || isLSP7_v0_12_0 || isLSP7_v0_14_0) {
            return true;
        }
        if (errorIsERC165 || isERC165 === false || (isLSP7_current === false && isLSP7_v0_12_0 === false && isLSP7_v0_14_0 === false)) {
            return false;
        }
        return undefined;
    }, [isLSP7_current, isLSP7_v0_12_0, isLSP7_v0_14_0, isERC165, errorIsERC165]);

    // ERC20 calls
    const { data: totalSupply, isFetching: isFetchingTotalSupply, error: errorTotalSupply } = useReadContract({
        address,
        abi: erc20Abi || [],
        functionName: "totalSupply",
        chainId,
    });

    const { data: decimals, isFetching: isFetchingDecimals, error: errorDecimals } = useReadContract({
        address,
        abi: erc20Abi || [],
        functionName: "decimals", 
        chainId,
    });

    const { data: erc20Name, isFetching: isFetchingErc20Name, error: errorErc20Name } = useReadContract({
        address: isLSP7 === false ? address : undefined,
        abi: erc20Abi || [],
        functionName: "name",
        chainId,
    });
    
    const { data: erc20Symbol, isFetching: isFetchingErc20Symbol, error: errorErc20Symbol } = useReadContract({
        address: isLSP7 === false ? address : undefined,
        abi: erc20Abi || [],
        functionName: "symbol",
        chainId,
    });

    const tokenType: "erc20" | "lsp7" | undefined = useMemo(() => {
        if (isLSP7 === false && typeof erc20Name === "string" && typeof erc20Symbol === "string" && typeof decimals === "number") {
            return "erc20";
        }
        if (isLSP7 === true) {
            return "lsp7";
        }
        return undefined;
    }, [isLSP7, erc20Name, erc20Symbol]);

    const { lsp7Data, isFetching: isFetchingLsp7Data, error: errorLsp7Data } = useLsp7Metadata(tokenType === "lsp7" ? address : undefined, tokenType === "lsp7" ? chainId : undefined);

    const erc20Data = useMemo(() => {
        if (tokenType === "erc20") {
            return {
                name: erc20Name,
                symbol: erc20Symbol,
            };
        }
        return undefined;
    }, [tokenType, erc20Name, erc20Symbol]);

    const isFetching = isFetchingTotalSupply || isFetchingDecimals || isFetchingErc20Name || isFetchingErc20Symbol || isFetchingLsp7Data;
    const error =
        errorTotalSupply ||
        errorDecimals ||
        errorErc20Name ||
        errorErc20Symbol ||
        errorLsp7Data ||
        lsp7Data?.errors?.[Object.keys(lsp7Data?.errors || {})[0] as keyof LSP7Errors]

    const tokenData = useMemo(() => ({
        isERC165,
        type: tokenType,
        totalSupply,
        decimals,
        erc20Data,
        lsp7Data,
        isFetching,
        error,
    }), [isERC165, tokenType, totalSupply, decimals, erc20Data, lsp7Data, isFetching, error]);

    return tokenData;
}

// New hook specifically for LSP7 metadata using erc725.js
function useLsp7Metadata(address?: `0x${string}`, chainId?: number) {
    const [lsp7Data, setLsp7Data] = useState<LSP7Data | undefined>(undefined);
    const [isFetching, setIsFetching] = useState(!!address && chainId !== undefined);
    const [error, setError] = useState<any>(null);

    // Get public client instead of connector client for ERC725.js
    const publicClient = usePublicClient({ chainId });

    useEffect(() => {
        if (!address || chainId === undefined || !publicClient) {
            setLsp7Data(undefined);
            return;
        }

        let mounted = true;
        setIsFetching(true);
        setError(null);

        const fetchMetadata = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { ERC725 } = await import('@erc725/erc725.js');
                const lsp4Schema = await import('@erc725/erc725.js/schemas/LSP4DigitalAsset.json');

                const erc725js = new ERC725(
                    lsp4Schema.default || lsp4Schema,
                    address,
                    publicClient.transport.url, // Use the RPC URL from the public client
                    {
                        // ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
                        ipfsGateway: 'https://dweb.link/ipfs',
                    }
                );

                // Fetch all LSP4 data
                const [tokenName, tokenSymbol, tokenType, metadata, creators] = await Promise.allSettled([
                    erc725js.fetchData('LSP4TokenName'),
                    erc725js.fetchData('LSP4TokenSymbol'),
                    erc725js.fetchData('LSP4TokenType'),
                    erc725js.fetchData('LSP4Metadata'),
                    erc725js.fetchData('LSP4Creators[]'),
                ]);

                if (!mounted) return;

                const result: LSP7Data = {};

                if (tokenName.status === 'fulfilled' && tokenName.value?.value) {
                    result.lsp4TokenName = String(tokenName.value.value);
                }
                if (tokenSymbol.status === 'fulfilled' && tokenSymbol.value?.value) {
                    result.lsp4TokenSymbol = String(tokenSymbol.value.value);
                }
                if (tokenType.status === 'fulfilled' && tokenType.value?.value) {
                    result.lsp4TokenType = Number(tokenType.value.value);
                }
                if (metadata.status === 'fulfilled' && metadata.value?.value) {
                    result.lsp4Metadata = metadata.value.value;
                }
                if (creators.status === 'fulfilled' && Array.isArray(creators.value?.value)) {
                    result.lsp4Creators = creators.value.value as string[];
                }

                if (tokenName.status === 'rejected') {
                    result.errors = {
                        ...result.errors,
                        lsp4TokenName: tokenName.reason,
                    };
                }
                if (tokenSymbol.status === 'rejected') {
                    result.errors = {
                        ...result.errors,
                        lsp4TokenSymbol: tokenSymbol.reason,
                    };
                }
                if (tokenType.status === 'rejected') {
                    result.errors = {
                        ...result.errors,
                        lsp4TokenType: tokenType.reason,
                    };
                }
                if (metadata.status === 'rejected') {
                    result.errors = {
                        ...result.errors,
                        lsp4Metadata: metadata.reason,
                    };
                }
                if (creators.status === 'rejected') {
                    result.errors = {
                        ...result.errors,
                        lsp4Creators: creators.reason,
                    };
                }

                setLsp7Data(result);
            } catch (error) {
                console.error('Error fetching LSP7 metadata:', error);
                if (!mounted) return;
                setLsp7Data({
                    errors: {
                        otherError: error instanceof Error ? error.message : 'Failed to fetch metadata',
                    },
                });
            }
        };

        fetchMetadata().finally(() => {
            setIsFetching(false);
        });

        return () => {
            mounted = false;
        };
    }, [address, chainId, publicClient]);

    const result = useMemo(() => ({
        lsp7Data,
        isFetching,
        error,
    }), [lsp7Data, isFetching, error]);

    return result;
}