import type { CommunityInfoResponsePayload, UserInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import { injected, useAccount, useConnect, useDisconnect } from "wagmi";
import { useCgData } from "~/context/cg_data";

export default function Menu() {
  const { userInfo, communityInfo, isAdmin } = useCgData();

  return (
    <div className="card bg-base-300 m-4 p-3 grid grid-cols-2 gap-2">
      <div className="flex flex-row items-center justify-start gap-4">
        {!!communityInfo && <CommunityInfo communityInfo={communityInfo} />}
        <NavLink to="/" className="link link-neutral">Airdrops</NavLink>
        {isAdmin && (<>
          <NavLink to="/create" className="link link-neutral">Create Airdrop</NavLink>
        </>)}
      </div>
      <div className="flex flex-row items-center justify-end gap-2">
        <WalletConnect />
      </div>
    </div>
  );
}

function CommunityInfo({ communityInfo }: { communityInfo: CommunityInfoResponsePayload }) {
  if (!communityInfo.smallLogoUrl && !communityInfo.largeLogoUrl) return null;

  return (
    <div className="avatar">
      <div className="w-10 rounded-xl">
        <img src={communityInfo.smallLogoUrl || communityInfo.largeLogoUrl} />
      </div>
    </div>
  )
}

function UserInfo({ userInfo, isAdmin }: { userInfo: UserInfoResponsePayload, isAdmin: boolean }) {
  if (!userInfo.imageUrl && !userInfo.name) return null;

  return (<div className="card flex flex-row items-center gap-2 p-2 rounded-full">
    {userInfo.imageUrl && <div className="avatar avatar-online indicator">
      <div className="w-8 rounded-full">
        <img src={userInfo.imageUrl} />
      </div>
    </div>}
    {userInfo.name && <div className="pr-1">{userInfo.name}</div>}
  </div>)
}

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const installedWallets = connectors.filter(c => c.type === "injected");

  if (isConnected) {
    return (
      <div className="flex flex-row items-center">
        <p className="font-mono text-sm mb-2">Connected: {address}</p>
        <button className="btn btn-sm btn-outline" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (<>
    <button
      className="btn btn-sm btn-secondary"
      onClick={() => (document.getElementById('my_modal_2') as any)?.showModal()}
    >
      Connect Wallet
    </button>
    <dialog id="my_modal_2" className="modal">
      <div className="modal-box flex flex-col gap-2 w-sm">
        <b>Choose a wallet to connect</b>
        {installedWallets.map(c => (
          <button key={c.id} className="btn btn-secondary w-full" onClick={() => connect({ connector: c })}>
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