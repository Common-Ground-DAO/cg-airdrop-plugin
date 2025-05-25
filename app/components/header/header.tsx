import type { CommunityInfoResponsePayload, UserInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { useAccount, useConnect, useDisconnect } from "wagmi";
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
      <div className="w-10 rounded-xl">
        <img src={communityInfo.smallLogoUrl || communityInfo.largeLogoUrl} />
      </div>
    </div>
    <div className="text-xl font-bold">
      {communityInfo.title}
    </div>
  </>)
}

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const installedWallets = connectors.filter(c => c.type === "injected");

  if (isConnected) {
    return (
      <div className="flex flex-row items-center gap-2">
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