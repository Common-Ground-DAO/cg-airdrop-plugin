import type { Route } from './+types/api.airdrop.items'
import { prisma } from '~/lib/db';

// API-only route - handles POST requests to create airdrops
export async function action({ request, params }: Route.ActionArgs) {
  const airdropId = params.airdropId;

  const airdropItems = await prisma.airdropItem.findMany({
    where: {
      airdropId: parseInt(airdropId)
    }
  });

  return airdropItems;
} 