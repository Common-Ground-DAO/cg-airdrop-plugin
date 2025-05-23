import type { CgPluginLib } from "@common-ground-dao/cg-plugin-lib";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export async function useAirdropClaimFactory () {
    const { AirdropClaim__factory } = await import("../contracts/factories/contracts/AirdropClaim__factory");
    return AirdropClaim__factory;
}

let _cgPluginLib: CgPluginLib | null = null;
let _cgPluginLibPromise: Promise<CgPluginLib> | null = null;
export function useCgPluginLib () {
    const [cgPluginLib, setCgPluginLib] = useState<CgPluginLib | null>(_cgPluginLib);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (!cgPluginLib && !_cgPluginLibPromise) {
            _cgPluginLibPromise = (async () => {
                const { CgPluginLib } = await import("@common-ground-dao/cg-plugin-lib");
                console.log("Imported CgPluginLib");
                const iframeUid = searchParams.get("iframeUid");
                if (!!iframeUid) {
                    const result = await CgPluginLib.initialize(iframeUid, '/api/sign', import.meta.env.VITE_PLUGIN_PUBLIC_KEY);
                    console.log("Initialized CgPluginLib");
                    _cgPluginLib = result;
                    setCgPluginLib(result);
                    return result;
                }
                else {
                    throw new Error("No iframeUid found");
                }
            })();
        }
        else if (!cgPluginLib && _cgPluginLibPromise) {
            _cgPluginLibPromise.then(setCgPluginLib);
        }
    }, [cgPluginLib]);    
    
    return cgPluginLib;
}