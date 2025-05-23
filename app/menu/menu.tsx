import { useState } from "react";
import { Form, useSubmit } from "react-router";

export default function Menu() {
  const [isCreatingAirdrop, setIsCreatingAirdrop] = useState(false);
  const submit = useSubmit();

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

  return (
    <div className="flex flex-col gap-4 max-w-[200px] w-[200px] overflow-hidden">
      {/* <div className="avatar">
        <div className="w-24 rounded-full">
          <img src="/logo.png" />
        </div>
      </div> */}
      <div className="flex flex-col gap-2">
        <button className="btn btn-primary" onClick={handleCreateAirdrop}>Create Airdrop</button>
      </div>
    </div>
  );
}