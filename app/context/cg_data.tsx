import type { CommunityInfoResponsePayload, UserInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCgPluginLib } from "./plugin_lib";

type CgData = {
    userInfo: UserInfoResponsePayload | null;
    communityInfo: CommunityInfoResponsePayload | null;
    isAdmin: boolean;
    refresh: () => Promise<void>;
}

const CgDataContext = createContext<CgData>({
    userInfo: null,
    communityInfo: null,
    isAdmin: false,
    refresh: async () => {},
});

export function CgDataProvider({ children }: { children: React.ReactNode }) {
    const promiseRef = useRef<Promise<void> | null>(null);
    const cgPluginLib = useCgPluginLib();
    const [cgData, setCgData] = useState<CgData>({
        userInfo: null,
        communityInfo: null,
        isAdmin: false,
        refresh: async () => (promiseRef.current || undefined),
    });

    const loadData = useCallback(async () => {
        if (!cgPluginLib) throw new Error("CgPluginLib not initialized");
        const [userInfo, communityInfo] = await Promise.all([
            cgPluginLib.getUserInfo(),
            cgPluginLib.getCommunityInfo(),
        ]);
        const isAdmin = communityInfo.data.roles.some(role => role.title === "Admin" && role.type === "PREDEFINED" && userInfo.data.roles.includes(role.id));
        return {
            userInfo: userInfo.data,
            communityInfo: communityInfo.data,
            isAdmin,
        };
    }, [cgPluginLib]);

    const refresh = useCallback(async () => {
        if (!promiseRef.current) {
            promiseRef.current = (async () => {
                const data = await loadData();
                if (!data) throw new Error("Failed to load data");
                setCgData({ ...data, refresh });
            })().finally(() => {
                promiseRef.current = null;
            });
        }
        return promiseRef.current;
    }, [loadData]);

    useEffect(() => {
        if (!!cgPluginLib) {
            refresh();
        }
    }, [cgPluginLib, refresh]);

    return <CgDataContext.Provider value={cgData}>{children}</CgDataContext.Provider>;
}

export function useCgData () {
    return useContext(CgDataContext);
}