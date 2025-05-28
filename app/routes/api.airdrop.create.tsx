import { isUserAdmin, validateCommunityData, validateUserData } from '~/lib/cgDataUtils';
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
  const tree = JSON.parse(formData.get("tree") as string || "null");

  // Todo: validate all fields?

  const communityInfo = await validateCommunityData(communityInfoRaw);
  const userInfo = await validateUserData(userInfoRaw);
  const communityInfoTimestampAge = Date.now() - communityInfo.signatureTimestamp;
  const userInfoTimestampAge = Date.now() - userInfo.signatureTimestamp;

  if (communityInfoTimestampAge > 120_000 || userInfoTimestampAge > 120_000) {
    throw new Error("The provided signed community or user data is too old, please try again.");
  }
  if (communityInfo.result.data.id !== communityId) {
    throw new Error("Community ID mismatch");
  }
  if (userInfo.result.data.id !== creatorId) {
    throw new Error("User ID mismatch");
  }
  const isAdmin = await isUserAdmin(communityInfo.result.data, userInfo.result.data);
  if (!isAdmin) {
    throw new Error("User is not an admin");
  }

  const existingCount = await prisma.airdrop.count({
    where: {
      communityId,
    }
  });
  
  if (existingCount >= 10) {
    throw new Error("You have reached the maximum number of airdrops for this community.");
  }

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

  if (tree) {
    await prisma.merkleTree.create({
      data: {
        airdropId,
        data: tree
      }
    });
  }

  return ({ airdropId });
} 