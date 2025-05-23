import type { Route } from './+types/api.airdrop.list'
import { prisma } from '~/lib/db';

// API-only route - handles POST requests to create airdrops
export async function action({ request, params }: Route.ActionArgs) {
  const communityId = params.communityId;

  const airdrops = await prisma.airdrop.findMany({
    where: {
      communityId
    }
  });

  return airdrops;
} 