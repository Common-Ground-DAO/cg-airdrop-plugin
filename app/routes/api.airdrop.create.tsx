import type { UserInfoResponsePayload, CommunityInfoResponsePayload } from '@common-ground-dao/cg-plugin-lib-host';
import { prisma } from '~/lib/db';

// API-only route - handles POST requests to create airdrops
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const creatorId = formData.get("creatorId") as string;
  const communityId = formData.get("communityId") as string;
  const erc20Address = formData.get("erc20Address") as string;
  const chainId = formData.get("chainId") as string;
  const chainName = formData.get("chainName") as string;
  const airdropAddress = formData.get("airdropAddress") as string;
  const communityInfoRaw = formData.get("communityInfoRaw") as string;
  const userInfoRaw = formData.get("userInfoRaw") as string;
  const items = JSON.parse(formData.get("items") as string || "[]");

  // Todo: validate all fields?

  const communityInfo = JSON.parse(communityInfoRaw) as CommunityInfoResponsePayload;
  const userInfo = JSON.parse(userInfoRaw) as UserInfoResponsePayload;

  console.log(communityInfo);
  console.log(userInfo);

  const { id: airdropId } = await prisma.airdrop.create({
    data: {
      name,
      creatorId,
      communityId,
      erc20Address,
      chainId: parseInt(chainId),
      chainName,
      airdropAddress,
      items: {
        createMany: {
          data: items
        }
      }
    }
  });

  return ({ airdropId });
} 