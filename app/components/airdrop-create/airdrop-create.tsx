import { useCallback, useState } from "react";
import { NavLink, useSubmit } from "react-router";
import { useCgData } from "~/context/cg_data";


export default function AirdropView() {
  const [step, setStep] = useState<"csv" | "deploy">("csv");
  const { communityInfo, userInfo } = useCgData();
  const submit = useSubmit();

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

    submit(formData, { method: "post", action: "/api/airdrop/create", navigate: false });
  }, [communityInfo, userInfo, submit]);

  return (
    <div className="px-8 pb-4">
      <h1 className="text-3xl font-bold mb-6">Create Airdrop</h1>
      <button onClick={handleCreateAirdrop} className="btn btn-primary">Create Airdrop</button>
    </div>
  );
}