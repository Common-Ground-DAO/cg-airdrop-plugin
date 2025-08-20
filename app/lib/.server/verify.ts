import verificationData from "~/contracts/.server/verification-data.json";
import { prisma } from "./db";
import env from "./env";
import { ethers } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import type { StandardMerkleTreeData } from "@openzeppelin/merkle-tree/dist/standard";
import FormData from "form-data";

const RETRY_DELAY = 1000 * 60 * 1; // 1 minute

export type VerificationStatus = {
  status: "not-started" | "success" | "error";
  version: 1;
  etherscanResponse?: string | Record<string, any> | null;
  blockscoutResponse?: string | Record<string, any> | null;
  verifiedAt: number;
  verifiedUrls: string[];
  error?: any;
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

type ContractPath = keyof typeof verificationData.contractImports;
const parsedInputObject = JSON.parse(verificationData.sourceCode) as {
  language: string;
  sources: Partial<Record<ContractPath, any>>;
  settings: Record<string, any>;
};

function getFilteredContractSources(contractName: ContractName): typeof parsedInputObject {
  const contractPath = Object.keys(verificationData.contractImports).find((name) => name.endsWith(`${contractName}.sol`)) as ContractPath | undefined;
  if (!contractPath) {
    throw new Error("Contract not found");
  }
  // Recursively handle all imports
  const gatheredImports = new Set<ContractPath>();
  const gatherImportsRecursive = (path: ContractPath) => {
    gatheredImports.add(path);
    for (const newPath of verificationData.contractImports[path] as ContractPath[]) {
      if (gatheredImports.has(newPath)) {
        continue;
      }
      gatherImportsRecursive(newPath);
    }
  };
  gatherImportsRecursive(contractPath);
  // Create filtered sources object
  const newSources: Partial<Record<ContractPath, any>> = {};
  for (const importPath of Array.from(gatheredImports)) {
    newSources[importPath] = parsedInputObject.sources[importPath];
  }
  return {
    ...parsedInputObject,
    sources: newSources,
  };
}

function getEtherscanUrls(chainId: number): string[] {
  switch (chainId) {
    case 31337: // Hardhat
      return [];
    case 1: // Mainnet
      return ["https://etherscan.io"];
    case 8453: // Base
      return ["https://basescan.org"];
    case 56: // BNB Smart Chain
      return ["https://bscscan.com"];
    case 42161: // Arbitrum One
      return ["https://arbiscan.io"];
    case 42170: // Arbitrum Nova
      return ["https://nova.arbiscan.io"];
    case 43114: // Avalanche
      return [];
    case 42220: // Celo
      return ["https://celoscan.io"];
    case 250: // Fantom
      return [];
    case 100: // Gnosis
      return ["https://gnosisscan.io"];
    case 59144: // Linea Mainnet
      return ["https://lineascan.build"];
    case 42: // Lukso
      return [];
    case 4201: // Lukso Testnet
      return [];
    case 10: // Optimism
      return ["https://optimistic.etherscan.io"];
    case 137: // Polygon
      return ["https://polygonscan.com"];
    case 1101: // Polygon zkEVM
      return [];
    case 534352: // Scroll
      return ["https://scrollscan.com"];
    case 11155111: // Sepolia
      return ["https://sepolia.etherscan.io"];
    default:
      return [];
  }
}

function getBlockscoutBaseUrls(chainId: number): string[] {
  switch (chainId) {
    case 31337: // Hardhat
      return [];
    case 1: // Mainnet
      return ["https://eth.blockscout.com"];
    case 8453: // Base
      return ["https://base.blockscout.com"];
    case 56: // BNB Smart Chain
      return [];
    case 42161: // Arbitrum One
      return ["https://arbitrum.blockscout.com"];
    case 42170: // Arbitrum Nova
      return ["https://arbitrum-nova.blockscout.com"];
    case 43114: // Avalanche
      return [];
    case 42220: // Celo
      return ["https://celo.blockscout.com"];
    case 250: // Fantom
      return [];
    case 100: // Gnosis
      return ["https://gnosis.blockscout.com"];
    case 59144: // Linea Mainnet
      return ["https://explorer.linea.build"];
    case 42: // Lukso
      return ["https://explorer.lukso.network"];
    case 4201: // Lukso Testnet
      return ["https://explorer.execution.testnet.lukso.network"];
    case 10: // Optimism
      return ["https://explorer.optimism.io"];
    case 137: // Polygon
      return ["https://polygon.blockscout.com"];
    case 1101: // Polygon zkEVM
      return [];
    case 534352: // Scroll
      return ["https://scroll.blockscout.com"];
    case 11155111: // Sepolia
      return ["https://eth-sepolia.blockscout.com"];
    default:
      return [];
  }
}

function verifyBlockscout({
  contractName,
  filteredSourceCode,
  contractAddress,
  constructorArgs,
  baseUrl,
}: {
  contractName: ContractName,
  filteredSourceCode: string,
  contractAddress: `0x${string}`,
  constructorArgs: string,
  baseUrl: string,
}) {
  const form = new FormData();
  form.append("compiler_version", verificationData.compilerVersion);
  form.append("contract_name", contractName);
  form.append("files[0]", Buffer.from(filteredSourceCode, "utf-8"), "input.json");
  form.append("autodetect_constructor_args", "false");
  form.append("constructor_args", constructorArgs);
  form.append("license_type", "mit");

  const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}api/v2/smart-contracts/${contractAddress}/verification/via/standard-input`;
  return promiseFormSubmit(form, url);
}

function verifyEtherscan({
  contractName,
  filteredSourceCode,
  chainId,
  contractAddress,
  constructorArgs,
  url,
}: {
  contractName: ContractName,
  filteredSourceCode: string,
  chainId: number,
  contractAddress: `0x${string}`,
  constructorArgs: string,
  url: string,
}) {
  if (!env.ETHERSCAN_API_KEY) {
    return null;
  }
  const contractPath = Object.keys(verificationData.contractImports).find((name) => name.endsWith(`${contractName}.sol`));
  if (!contractPath) {
    throw new Error("Contract not found");
  }

  const form = new FormData();
  form.append("module", "contract");
  form.append("action", "verifysourcecode");
  form.append("apikey", env.ETHERSCAN_API_KEY);
  form.append("chainId", chainId.toString());
  form.append("codeformat", "solidity-standard-json-input");
  form.append("sourceCode", filteredSourceCode);
  form.append("contractaddress", contractAddress);
  form.append("compilerversion", "v" + verificationData.compilerVersion);
  form.append("contractname", `${contractPath}:${contractName}`);
  form.append("constructorArguments", constructorArgs.startsWith("0x") ? constructorArgs.slice(2) : constructorArgs);

  return promiseFormSubmit(form, url);
}

export async function verifyContract(type: "airdrop" | "vesting", id: number): Promise<{ status: "success" | "error", error?: string, verificationStatus?: VerificationStatus }> {
  let verificationStatus: VerificationStatus = {
    status: "not-started",
    version: 1,
    verifiedAt: Date.now(),
    verifiedUrls: [],
  };
  let etherscanDone = false;
  let blockscoutDone = false;
  let contractName: ContractName;
  let chainId: number;
  let contractAddress: `0x${string}`;
  let constructorArgs: string;
  let existingVerification: VerificationStatus | undefined;

  // Airdrop verification
  if (type === "airdrop") {
    const airdrop = await prisma.airdrop.findUnique({
      where: { id },
      include: {
        merkleTree: true,
      }
    });
    if (!airdrop) {
      return { status: "error", error: "Airdrop not found" };
    }
    if (airdrop.createdAt.getTime() > Date.now() - 1000 * 60) {
      return { status: "error", error: "Airdrop is too new, please wait one minute before verifying" };
    }
    if (!airdrop.merkleTree) {
      return { status: "error", error: "Airdrop has no merkle tree" };
    }
    // Load merkle tree 
    const tree = StandardMerkleTree.load(airdrop.merkleTree.data as unknown as StandardMerkleTreeData<[string, string]>);

    contractName = "AirdropClaim";
    existingVerification = airdrop.verification as VerificationStatus | undefined;
    chainId = airdrop.chainId;
    contractAddress = airdrop.airdropAddress as `0x${string}`;
    constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address", "bytes32"], [airdrop.tokenAddress, tree.root as `0x${string}`]);
  
  // Vesting verification
  } else if (type === "vesting") {
    const vesting = await prisma.vesting.findUnique({
      where: { id },
    });
    if (!vesting) {
      return { status: "error", error: "Vesting not found" };
    }
    if (vesting.createdAt.getTime() > Date.now() - 1000 * 60) {
      return { status: "error", error: "Vesting is too new, please wait one minute before verifying" };
    }

    contractName = "VestingWallet";
    if (vesting.isLSP7) {
      contractName = "LSP7Vesting";
    }
    existingVerification = vesting.verification as VerificationStatus | undefined;
    chainId = vesting.chainId;
    contractAddress = vesting.contractAddress as `0x${string}`;
    constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint64", "uint64"], [vesting.tokenAddress, vesting.startTimeSeconds, vesting.endTimeSeconds - vesting.startTimeSeconds]);
  }
  else {
    throw new Error("Invalid contract type: " + type);
  }

  if (existingVerification) {
    if (!!existingVerification.etherscanResponse) {
      etherscanDone = true;
      verificationStatus.etherscanResponse = existingVerification.etherscanResponse;
    }
    if (!!existingVerification.blockscoutResponse) {
      blockscoutDone = true;
      verificationStatus.blockscoutResponse = existingVerification.blockscoutResponse;
    }
    if (etherscanDone && blockscoutDone) {
      return { status: "error", error: "Contract already verified" };
    }
    // Only retry if the verification is older than 1 minute
    if (existingVerification.verifiedAt > Date.now() - RETRY_DELAY) {
      const waitTime = Math.ceil((existingVerification.verifiedAt + RETRY_DELAY - Date.now()) / 1000);
      return { status: "error", error: `Wait another ${waitTime}s before retrying` };
    }
  }

  const promises: Promise<{
    type: "etherscan" | "blockscout";
    error?: string;
    response?: string | Record<string, any> | null;
    verifiedUrl?: string;
  }>[] = [];

  const filteredContractSources = getFilteredContractSources(contractName);
  const filteredSourceCode = JSON.stringify(filteredContractSources);

  // Verify on Etherscan
  const etherscanUrl = getEtherscanUrls(chainId)[0] as string | undefined;
  if (etherscanUrl && !etherscanDone) {
    // Note that etherscanUrl is not used in the verifyEtherscan function, but
    // only to check if the chain is supported by Etherscan
    promises.push(new Promise(async (resolve, reject) => {
      try {
        const response = await verifyEtherscan({
          contractName,
          filteredSourceCode,
          chainId,
          contractAddress,
          constructorArgs,
          url: "https://api.etherscan.io/api", // Do not use etherscanUrl here, it's only used to check if the chain is supported by Etherscan
        });
        resolve({
          type: "etherscan",
          response,
          verifiedUrl: etherscanUrl + "/address/" + contractAddress,
        });
      }
      catch (e) {
        console.error("Error verifying contract on Etherscan", e);
        resolve({
          type: "etherscan",
          error: e instanceof Error ? e.message : "Unknown error"
        });
      }
    }));
  }

  // Verify on Blockscout
  const blockscoutBaseUrl = getBlockscoutBaseUrls(chainId)[0] as string | undefined;
  if (blockscoutBaseUrl && !blockscoutDone) {
    // Note that blockscoutBaseUrl is used in the verifyBlockscout function, as
    // blockscout does not validate contracts in a central service
    promises.push(new Promise(async (resolve, reject) => {
      try {
        const response = await verifyBlockscout({
          contractName,
          filteredSourceCode,
          contractAddress,
          constructorArgs,
          baseUrl: blockscoutBaseUrl,
        });
        resolve({
          type: "blockscout",
          response,
          verifiedUrl: blockscoutBaseUrl + "/address/" + contractAddress,
        });
      }
      catch (e) {
        console.error("Error verifying contract on Blockscout", e);
        resolve({
          type: "blockscout",
          error: e instanceof Error ? e.message : "Unknown error"
        });
      }
    }));
  }

  const results = await Promise.all(promises);
  let success = false;
  for (const result of results) {
    if (result.response) {
      success = true;
      if (result.type === "etherscan") {
        verificationStatus.etherscanResponse = result.response;
      }
      else if (result.type === "blockscout") {
        verificationStatus.blockscoutResponse = result.response;
      }
    }
    if (result.verifiedUrl) {
      verificationStatus.verifiedUrls.push(result.verifiedUrl);
    }
    if (result.error) {
      verificationStatus.error += `${verificationStatus.error ? "\n" : ""}Error verifying on ${result.type} instance ${result.type === "blockscout" ? blockscoutBaseUrl : etherscanUrl}`
    }
  }
  if (success) {
    verificationStatus.status = "success";
  }

  // Update database
  if (type === "airdrop") {
    await prisma.airdrop.update({
      where: { id },
      data: { verification: verificationStatus },
    });
  }
  else if (type === "vesting") {
    await prisma.vesting.update({
      where: { id },
      data: { verification: verificationStatus },
    });
  }

  return { status: "success", verificationStatus };
}