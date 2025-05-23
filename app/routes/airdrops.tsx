import { prisma } from '~/lib/db';

// API-only route - handles POST requests to create airdrops
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const creatorId = formData.get("creatorId") as string;
  const communityId = formData.get("communityId") as string;
  const contract = formData.get("contract") as string;
  const items = JSON.parse(formData.get("items") as string || "[]");

  await prisma.airdrop.create({
    data: {
      name,
      creatorId,
      communityId,
      contract,
      items: {
        createMany: {
          data: items
        }
      }
    }
  });

  return { success: true };
} 