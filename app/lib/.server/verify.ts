import verificationData from "~/contracts/.server/verification-data.json";
import { prisma } from "./db";
import env from "./env";
import { ethers } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { StandardMerkleTreeData } from "@openzeppelin/merkle-tree/dist/standard";
import FormData from "form-data";

type VerificationStatus = {
  status: "not-started" | "pending" | "success" | "error";
  error?: string;
  data?: any;
};

type ContractName = "AirdropClaim" | "VestingWallet" | "LSP7Vesting";

async function promiseFormSubmit(form: FormData, url: string): Promise<string | Record<string, any>> {
  // Return a new Promise that will resolve with the response body
  return new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) {
        return reject(err);
      }

      let responseBody = '';
      
      // The `res` object is the IncomingMessage object
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        // The entire response has been received
        // Try to parse it as JSON if the Content-Type suggests it
        try {
          const contentType = res.headers['content-type'];
          if (contentType && contentType.includes('application/json')) {
            const data = JSON.parse(responseBody);
            resolve(data);
          } else {
            resolve(responseBody);
          }
        } catch (e) {
          reject(e); // Reject if JSON parsing fails
        }
      });
      
      res.on('error', (e) => {
        reject(e); // Handle any errors with the response stream
      });
    });
  });
}

function verifyBlockscout({
  contractName,
  contractAddress,
  constructorArgs,
  baseUrl,
}: {
  contractName: ContractName,
  contractAddress: `0x${string}`,
  constructorArgs: string,
  baseUrl: string,
}) {
  const form = new FormData();
  form.append("compiler_version", verificationData.compilerVersion);
  form.append("contract_name", contractName);
  form.append("files[0]", Buffer.from(verificationData.sourceCode, "utf-8"), "input.json");
  form.append("autodetect_constructor_args", "false");
  form.append("constructor_args", constructorArgs);
  form.append("license_type", "mit");

  const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}api/v2/smart-contracts/${contractAddress}/verification/via/standard-input`;
  return promiseFormSubmit(form, url);
}

function verifyEtherscan({
  contractName,
  chainId,
  contractAddress,
  constructorArgs,
  url,
}: {
  contractName: ContractName,
  chainId: number,
  contractAddress: `0x${string}`,
  constructorArgs: string,
  url: string,
}) {
  const fullContractName = verificationData.contractnames.find((name) => name.endsWith(`${contractName}.sol:${contractName}`));
  if (!fullContractName) {
    throw new Error("Contract not found");
  }

  const form = new FormData();
  form.append("module", "contract");
  form.append("action", "verifysourcecode");
  form.append("apikey", env.ETHERSCAN_API_KEY);
  form.append("chainId", chainId.toString());
  form.append("codeformat", "solidity-standard-json-input");
  form.append("sourceCode", verificationData.sourceCode);
  form.append("contractaddress", contractAddress);
  form.append("compilerversion", verificationData.compilerVersion);
  form.append("contractname", fullContractName);
  form.append("constructorArguments", constructorArgs);

  return promiseFormSubmit(form, url);
}

export async function verifyContract(type: "airdrop" | "vesting", id: number) {
  if (type === "airdrop") {
    const airdrop = await prisma.airdrop.findUnique({
      where: {
        id,
      },
      include: {
        merkleTree: true,
      }
    });
    if (!airdrop) {
      return { status: "error", error: "Airdrop not found" };
    }
    if (!airdrop.merkleTree) {
      return { status: "error", error: "Airdrop has no merkle tree" };
    }
    const contractName = verificationData.contractnames.find((name) => name.endsWith("AirdropClaim.sol:AirdropClaim"));
    if (!contractName) {
      return { status: "error", error: "AirdropClaim.sol:AirdropClaim contract not found" };
    }
    const tree = StandardMerkleTree.load(airdrop.merkleTree.data as unknown as StandardMerkleTreeData<[string, string]>);
    const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address", "bytes32"], [airdrop.tokenAddress, tree.root as `0x${string}`]);
    
    console.log(airdrop.chainId, airdrop.airdropAddress, constructorArgs);
    
    switch (airdrop.chainId) {
      case 1: // Mainnet
        const etherscanResponse = await verifyEtherscan({
          contractName: "AirdropClaim",
          chainId: airdrop.chainId,
          contractAddress: airdrop.airdropAddress as `0x${string}`,
          constructorArgs,
          url: "https://api.etherscan.io/api",
        });
        console.log(etherscanResponse);
        break;
      case 137: // Polygon
        break;
      case 8453: // Base
        break;
      case 42161: // Arbitrum
        break;
      case 11155111: // Sepolia
        const blockscoutResponse = await verifyBlockscout({
          contractName: "AirdropClaim",
          contractAddress: airdrop.airdropAddress as `0x${string}`,
          constructorArgs,
          baseUrl: "https://eth-sepolia.blockscout.com/",
        });
        console.log(blockscoutResponse);
        break;
      default:
        return { status: "error", error: "Unsupported chain ID" };
    }

  } else if (type === "vesting") {
    const vesting = await prisma.vesting.findUnique({
      where: {
        id,
      }
    });
  }
}