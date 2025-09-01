import { useCallback } from "react";
import { useCgData } from "~/context/cg_data";
import { useCgPluginLib } from "~/context/plugin_lib";

export default function Home() {
    const pluginLib = useCgPluginLib();
    const navigateLink = useCallback((a: HTMLAnchorElement) => {
        pluginLib?.navigate(a.href);
    }, [pluginLib]);
    const { communityInfo } = useCgData();

    return (
        <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
            <h1 className="text-xl font-bold p-4 pb-0">{communityInfo?.title || "Common Ground"}: Claim Tokens</h1>
            <div className=" flex flex-col px-4 gap-4 max-w-full">
                <p>
                    Here you can claim tokens, provided from the {communityInfo?.title || "Common Ground"} Community. There are two types of claims you can do:
                </p>
                <p>
                    <b>Vested claims</b><br/>
                    Vested claims are contracts deployed for a single beneficiary address. They have a start and end time, and tokens can be claimed linearly over the period once the contract has been funded. If you have a vested claim, connect your beneficiary wallet to be able to claim your tokens.
                </p>
                <p>
                    <b>Unvested claims</b><br/>
                    Unvested claims are contracts deployed for multiple beneficiary addresses. They don't have a start and end time, and tokens can be claimed instantly once the contract has been funded. If you have an unvested claim, connect your beneficiary wallet to see your own claimable tokens on top.
                </p>
                <p>
                    The smart contracts are available on <a href="https://github.com/common-ground-dao/cg-airdrop-plugin" onClick={(ev) => navigateLink(ev.currentTarget)} className="link link-primary" target="_blank" rel="noopener noreferrer">GitHub</a>.
                </p>
                <p>
                    If you need any help, please contact us on <a href="https://app.cg/c/commonground/channel/help/" onClick={(ev) => navigateLink(ev.currentTarget)} className="link link-primary" target="_blank" rel="noopener noreferrer">our help channel</a>.
                </p>
            </div>
        </div>
    );
}