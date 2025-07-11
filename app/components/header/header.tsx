import type { CommunityInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { IoChevronDown } from "react-icons/io5";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChains } from "wagmi";
import { useCgData } from "~/context/cg_data";

export default function Header() {
  const { communityInfo } = useCgData();

  return (
    <div className="p-4 grid grid-cols-2 gap-2">
      <div className="flex flex-row items-center justify-start gap-3">
        {!!communityInfo && <CommunityInfo communityInfo={communityInfo} />}
      </div>
      <div className="flex flex-row items-center justify-end gap-2">
        <WalletConnect />
      </div>
    </div>
  );
}

function CommunityInfo({ communityInfo }: { communityInfo: CommunityInfoResponsePayload }) {
  if (!communityInfo.smallLogoUrl && !communityInfo.largeLogoUrl && !communityInfo.title) return null;

  return (<>
    <div className="avatar">
      <div className="rounded-xl w-10 h-10">
        <img src={communityInfo.smallLogoUrl || communityInfo.largeLogoUrl} />
      </div>
    </div>
    <div className="text-xl font-bold">
      {communityInfo.title}
    </div>
  </>)
}

function ChainSwitcher() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const chains = useChains();

  if (!chain) return null;

  return (
    <div className="dropdown dropdown-end">
      <div 
        tabIndex={isPending ? -1 : 0} 
        role="button" 
        className={`btn btn-sm btn-outline ${isPending ? 'btn-disabled' : ''}`}
      >
        {isPending ? "Switching..." : chain.name} <IoChevronDown />
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        {chains.map((availableChain) => (
          <li key={availableChain.id}>
            <button
              onClick={() => switchChain({ chainId: availableChain.id })}
              className={`${chain.id === availableChain.id ? 'active' : ''}`}
              disabled={isPending}
            >
              {availableChain.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const installedWallets = connectors.filter(c => c.type === "injected");

  if (isConnected) {
    return (
      <div className="flex flex-row items-center gap-2">
        <ChainSwitcher />
        <p className="font-mono text-xs">Connected: {!address ? "Unknown" : `${address.slice(0, 6)}...${address.slice(-4)}`}</p>
        <button className="btn btn-sm btn-outline" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (<>
    <button
      className="btn btn-sm btn-primary"
      onClick={() => (document.getElementById('my_modal_2') as any)?.showModal()}
    >
      Connect Wallet
    </button>
    <dialog id="my_modal_2" className="modal">
      <div className="modal-box flex flex-col gap-2 w-sm">
        <b>Choose a wallet to connect</b>
        {installedWallets.map(c => (
          <button key={c.id} className="btn btn-primary w-full" onClick={() => connect({ connector: c })}>
            {c.name}
          </button>
        ))}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </>);
}