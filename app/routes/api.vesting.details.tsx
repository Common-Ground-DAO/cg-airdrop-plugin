import { prisma } from '~/lib/db';
import type { Route } from './+types/api.airdrop.details';

// API-only route - handles POST requests to create airdrops
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  // any todo here?

  return {};
}