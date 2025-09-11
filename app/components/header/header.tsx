import type { CommunityInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { IoChevronDown } from "react-icons/io5";
import { useAccount, useSwitchChain, useChains } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCgData } from "~/context/cg_data";

export default function Header() {
  const { communityInfo } = useCgData();

  return (
    <div className="p-4 flex gap-2 flex-wrap justify-between">
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
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-row items-center gap-2">
      {isConnected && <ChainSwitcher />}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button 
                      onClick={openConnectModal} 
                      type="button"
                      className="btn btn-sm btn-primary"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                return (
                  <div className="flex flex-row items-center gap-2">
                    <p className="font-mono text-xs">
                      Connected: {account.displayName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    </p>
                    <button 
                      onClick={openAccountModal} 
                      type="button"
                      className="btn btn-sm btn-outline"
                    >
                      Manage
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}