import type { CommunityInfoResponsePayload, UserInfoResponsePayload } from "@common-ground-dao/cg-plugin-lib";
import { useEffect, useMemo, useState } from "react";
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

  const handleCreateAirdrop = () => {
    setIsCreatingAirdrop(true);
    
    const formData = new FormData();
    formData.append("name", "Test Airdrop");
    formData.append("creatorId", "1");
    formData.append("communityId", "1");
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
  };

  const userComponent = useMemo(() => {
    if (!userInfo) return null;

    return (
      <div className="card bg-base-300 p-4">
        {!!userInfo.imageUrl && <div className="avatar">
          <div className="w-24 rounded-full">
            <img src={userInfo.imageUrl} />
          </div>
        </div>}
        {!!userInfo.name && <div className="text-sm">Welcome, {userInfo.name}</div>}
        {isAdmin && <div className="text-sm">You are an admin</div>}
      </div>
    )
  }, [userInfo, isAdmin]);

  return (
    <div className="card bg-base-200 max-w-[200px] w-[200px] overflow-hidden m-4 p-4">
      {userComponent}
      {isAdmin && (
        <button className="btn btn-primary" onClick={handleCreateAirdrop}>Create Airdrop</button>
      )}
    </div>
  );
}