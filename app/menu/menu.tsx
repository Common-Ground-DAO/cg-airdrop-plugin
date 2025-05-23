import type { CommunityInfoResponsePayload, UserInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Form, NavLink, useSubmit } from "react-router";
import { injected, useAccount, useConnect, useDisconnect } from "wagmi";
import { useCgPluginLib } from "~/hooks";

export default function Menu() {
  const submit = useSubmit();
  const cgPluginLib = useCgPluginLib();
  const [userInfo, setUserInfo] = useState<UserInfoResponsePayload | null>(null);
  const [communityInfo, setCommunityInfo] = useState<CommunityInfoResponsePayload | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (cgPluginLib) {
      console.log("Getting user data");
      cgPluginLib.getUserInfo().then(payload => {
        console.log("Got user data payload", payload);
        setUserInfo(payload.data);
      });
      cgPluginLib.getCommunityInfo().then(payload => {
        console.log("Got community data payload", payload);
        setCommunityInfo(payload.data);
      });
    }
  }, [cgPluginLib]);

  useEffect(() => {
    if (!!userInfo && !!communityInfo) {
      const adminRole = communityInfo.roles.find(role => role.title === "Admin" && role.type === "PREDEFINED");
      if (!!adminRole && userInfo.roles.includes(adminRole.id)) {
        setIsAdmin(true);
      }
    }
  }, [userInfo, communityInfo]);

  const handleCreateAirdrop = useCallback(() => {
    if (!communityInfo || !userInfo) return;
    
    const formData = new FormData();
    formData.append("name", "Test Airdrop");
    formData.append("creatorId", userInfo.id);
    formData.append("communityId", communityInfo.id);
    formData.append("contract", "0x0000000000000000000000000000000000000000");
    formData.append("items", JSON.stringify([
      {
        address: "0x0000000000000000000000000000000000000000",
        amount: "100",
      }, 
      {
        address: "0x0000000000000000000000000000000000000001",
        amount: "200",
      }
    ]));

    submit(formData, { method: "post", action: "/api/airdrops", navigate: false });
  }, [communityInfo, userInfo, submit]);

  return (
    <div className="card bg-base-300 m-4 p-3 grid grid-cols-2 gap-2">
      <div className="flex flex-row items-center justify-start gap-6">
        {!!communityInfo && <CommunityInfo communityInfo={communityInfo} />}
        <NavLink to="/" className="link link-neutral">Airdrops</NavLink>
        {isAdmin && (<>
          <NavLink to="/create" className="link link-neutral">Create Airdrop</NavLink>
        </>)}
      </div>
      <div className="flex flex-row items-center justify-end gap-2">
        <WalletConnect />
        {!!userInfo && <UserInfo userInfo={userInfo} isAdmin={isAdmin} />}
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
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

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

  return (
    <button
      className="btn btn-secondary"
      onClick={() => connect({ connector: injected() })}
    >
      Connect Wallet
    </button>
  );
}