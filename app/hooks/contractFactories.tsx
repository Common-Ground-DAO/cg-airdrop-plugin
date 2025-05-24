import { useEffect, useState } from "react";
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

export function useErc20Abi() {
    const erc20ContractFactory = useErc20ContractFactory();
    const [abi, setAbi] = useState<typeof ERC20__factory["abi"] | null>(erc20ContractFactory?.abi || null);

    useEffect(() => {
        if (!abi && erc20ContractFactory) {
            setAbi(erc20ContractFactory.abi);
        }
    }, [abi, erc20ContractFactory]);

    return abi;
}