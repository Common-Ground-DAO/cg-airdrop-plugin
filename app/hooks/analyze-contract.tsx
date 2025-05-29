import { INTERFACE_IDS, INTERFACE_ID_LSP7_PREVIOUS } from "@lukso/lsp-smart-contracts/constants";
import { LSP4DataKeys } from "@lukso/lsp4-contracts/constants"
import { useErc20Abi, useLsp4Abi, useLsp7Abi } from "./contracts";
import { useReadContract } from "wagmi";

export function useErc20Data(address?: `0x${string}`, chainId?: number) {
    const erc20Abi = useErc20Abi();
    const lsp7Abi = useLsp7Abi();
    const lsp4Abi = useLsp4Abi();

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

    const { data: isLSP4, isFetching: isFetchingIsLSP4, error: errorIsLSP4 } = useReadContract({
        address,
        abi: lsp4Abi || [],
        functionName: "supportsInterface",
        chainId,
        args: [LSP4DataKeys.LSP4DigitalAssetMetadata],
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