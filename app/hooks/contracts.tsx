import { useEffect, useState } from "react";
import type { erc20Abi } from "viem";
import type { AirdropClaim__factory, ERC20__factory } from "~/contracts";
import type { lsp7DigitalAssetAbi } from "@lukso/lsp7-contracts/abi";
import type { lsp4DigitalAssetMetadataAbi } from "@lukso/lsp4-contracts/abi";
let _airdropFactory: typeof AirdropClaim__factory | null = null;

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
            const { lsp7DigitalAssetAbi } = await import("@lukso/lsp7-contracts/abi");
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
            const { lsp4DigitalAssetMetadataAbi } = await import("@lukso/lsp4-contracts/abi");
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