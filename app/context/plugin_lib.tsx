import { CgPluginLib } from "@common-ground-dao/cg-plugin-lib";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

const CgPluginLibContext = createContext<CgPluginLib | null>(null);

export function CgPluginLibProvider({ children }: { children: React.ReactNode }) {
    const [cgPluginLib, setCgPluginLib] = useState<{
        lib: CgPluginLib;
        iframeUid: string;
    } | null>(null);
    const [searchParams] = useSearchParams();
    const initPromiseRef = useRef<Promise<void> | null>(null);

    const iframeUid = useMemo(() => searchParams.get("iframeUid"), [searchParams]);

    useEffect(() => {
        if (iframeUid && !initPromiseRef.current && (!cgPluginLib || cgPluginLib.iframeUid !== iframeUid)) {
            initPromiseRef.current = CgPluginLib.initialize(iframeUid, `${import.meta.env.BASE_URL}api/sign`, import.meta.env.VITE_PLUGIN_PUBLIC_KEY)
                .then((lib) => {
                    setCgPluginLib({ lib, iframeUid });
                })
                .catch((error) => {
                    setCgPluginLib(null);
                    console.error("Error initializing CgPluginLib", error);
                })
                .finally(() => {
                    initPromiseRef.current = null;
                });
        }
    }, [cgPluginLib, iframeUid]);

    return <CgPluginLibContext.Provider value={cgPluginLib?.lib || null}>{children}</CgPluginLibContext.Provider>;
}

export function useCgPluginLib () {
    return useContext(CgPluginLibContext);
}