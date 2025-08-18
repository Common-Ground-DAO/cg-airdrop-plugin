import hre from "hardhat";
import fs from "fs";
import path from "path";

const contractNames = ["AirdropClaim", "VestingWallet", "LSP7Vesting"];
const outputPath = path.join(process.cwd(), "app/contracts/.server");

async function main() {
  // Get build info paths
  const buildInfoPaths = await hre.artifacts.getBuildInfoPaths();
  if (buildInfoPaths.length !== 1) {
    console.log(buildInfoPaths);
    throw new Error("Expected 1 build info path, got " + buildInfoPaths.length);
  }
  const buildInfoPath = buildInfoPaths[0];
  const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));
  const { input, solcLongVersion } = buildInfo;
  const result = {
    sourceCode: JSON.stringify(input),
    contractnames: [] as string[],
    compilerVersion: solcLongVersion,
  };
  const sourceFiles = Object.keys(input.sources);
  for (const contractName of contractNames) {
    const contractPath = sourceFiles.find((file) => file.endsWith(contractName + ".sol"));
    if (!contractPath) {
      throw new Error("Contract " + contractName + " not found");
    }
    result.contractnames.push(`${contractPath}:${contractName}`);
  }
  const outputFile = path.join(outputPath, "verification-data.json");
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(result));
  console.log("Wrote verification data to " + outputFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 