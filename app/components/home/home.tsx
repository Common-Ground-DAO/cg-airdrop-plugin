import { useCallback } from "react";
import { useCgPluginLib } from "~/context/plugin_lib";

export default function Home() {
    const pluginLib = useCgPluginLib();
    const navigateLink = useCallback((a: HTMLAnchorElement) => {
        pluginLib?.navigate(a.href);
    }, [pluginLib]);

    return (
        <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
            <h1 className="text-xl font-bold p-4 pb-0">Common Ground Airdrops & Vestings</h1>
            <div className="p-4 max-w-full">
                <p className="mb-2">
                    Here you can claim your airdrops and vestings.
                </p>
                <p className="mb-2">
                    <ul className="list-disc list-inside my-4">
                        <li>If you open an airdrop, connect your beneficiary wallet to see your own airdrop on top</li>
                        <li>If you open a vesting, connect your beneficiary wallet to be able to claim your tokens</li>
                    </ul>
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