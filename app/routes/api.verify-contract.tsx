import { verifyContract } from '~/lib/.server/verify';

// API-only route - handles POST requests to trigger contract verification
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const contractType = formData.get("type") as "airdrop" | "vesting";
  const id = formData.get("id") as string;
  if (!["airdrop", "vesting"].includes(contractType)) {
    return { success: false, error: "Contract type is required and must be a string" };
  }
  if (!id || typeof id !== "string" || !/^\d+$/.test(id)) {
    return { success: false, error: "ID is required and must be a string and a number" };
  }

  try {
    await verifyContract(contractType, parseInt(id));
  } catch (error) {
    return { success: false, error: "Failed to verify contract" };
  }

  return { success: true, error: null };
}