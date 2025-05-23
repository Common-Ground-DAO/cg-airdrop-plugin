import type { CommunityInfoResponsePayload, UserInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Form, useSubmit } from "react-router";
import { useCgPluginLib } from "~/hooks";

export default function Menu() {
  const [isCreatingAirdrop, setIsCreatingAirdrop] = useState(false);
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
    setIsCreatingAirdrop(true);
    
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
    <div className="card bg-base-200 m-4 p-3 grid grid-cols-3 gap-2">
      {!!communityInfo && <CommunityInfo communityInfo={communityInfo} />}
      <div className="flex flex-row items-center justify-center gap-2">
        <button className="btn btn-accent btn-sm rounded-full" onClick={handleCreateAirdrop}>Airdrops</button>
        {isAdmin && (<>
          <button className="btn btn-accent btn-sm rounded-full" onClick={handleCreateAirdrop}>Create Airdrop</button>
        </>)}
      </div>
      {!!userInfo && <UserInfo userInfo={userInfo} isAdmin={isAdmin} />}
    </div>
  );
}

function CommunityInfo({ communityInfo }: { communityInfo: CommunityInfoResponsePayload }) {
  return (
    <div className="flex flex-row items-center gap-2">
      {communityInfo.smallLogoUrl && <div className="avatar">
        <div className="w-10 rounded-xl">
          <img src={communityInfo.smallLogoUrl} />
        </div>
      </div>}
      {communityInfo.title && <div className="text-lg">{communityInfo.title}</div>}
    </div>
  )
}

function UserInfo({ userInfo, isAdmin }: { userInfo: UserInfoResponsePayload, isAdmin: boolean }) {
  return (
    <div className="flex flex-row items-center justify-end gap-2">
      {userInfo.imageUrl && <div className="avatar avatar-online indicator">
        <div className="w-8 rounded-full">
          <img src={userInfo.imageUrl} />
        </div>
      </div>}
      {userInfo.name && <div className="text-lg">{userInfo.name}</div>}
    </div>
  )
}