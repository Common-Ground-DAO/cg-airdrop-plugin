import { useCallback } from "react";
import { useCgPluginLib } from "~/context/plugin_lib";

export default function Home() {
    const pluginLib = useCgPluginLib();

    const navigateLink = useCallback((a: HTMLAnchorElement) => {
        pluginLib?.navigate(a.href);
    }, [pluginLib]);

    return (
        <div className="flex flex-col gap-4 flex-1 h-full max-h-full overflow-hidden">
            <h1 className="text-xl font-bold p-4 pb-0">CG Airdrop & Vesting Plugin</h1>
            <div className="alert alert-warning shadow-lg mt-4 mx-4">
                <div>
                    <span className="font-bold">Warning:</span> The smart contracts used by this plugin have <b>not</b> been reviewed yet. Use this plugin for <b>testing purposes only</b>.
                </div>
            </div>
            <div className="p-4 max-w-2xl">
                <p className="mb-2">
                    This plugin allows admins to manage token airdrops and vestings for this community. Users can view and claim the airdrops and release the vestings.
                </p>
                <ul className="list-disc list-inside mb-2">
                    <li>Connect your wallet to see your airdrops and vestings.</li>
                    <li>Community admins can create new airdrops and vestings.</li>
                    <li>Upload a CSV file with recipient addresses and token amounts to create an airdrop.</li>
                    <li>Set up vestings to release tokens over time to a beneficiary.</li>
                </ul>
                <p>
                    This plugin and the smart contracts are available on <a href="https://github.com/common-ground-dao/cg-airdrop-plugin" onClick={(ev) => navigateLink(ev.currentTarget)} className="link link-primary" target="_blank" rel="noopener noreferrer">GitHub</a>.
                </p>
            </div>
        </div>
    );
}