import hre from "hardhat";
import fs from "fs";
import path from "path";

const contractNames = ["AirdropClaim", "VestingWallet", "LSP7Vesting"];
const outFilePath = path.join(process.cwd(), "app/contracts/.server");

async function main() {
  // Get build info paths
  const buildInfoPaths = await hre.artifacts.getBuildInfoPaths();
  if (buildInfoPaths.length !== 1) {
    console.log(buildInfoPaths);
    throw new Error("Expected 1 build info path, got " + buildInfoPaths.length);
  }
  const buildInfoPath = buildInfoPaths[0];
  const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));
  const { input, output, solcLongVersion } = buildInfo;
  const result = {
    sourceCode: JSON.stringify(input),
    compilerVersion: solcLongVersion,
    contractImports: {} as Record<string, string[]>,
  };
  const outputFiles = Object.keys(output.sources);
  for (const outputFile of outputFiles) {
    const nodes = output.sources[outputFile].ast?.nodes;
    if (!nodes) {
      throw new Error("No nodes found for " + outputFile);
    }
    const importPaths = new Set<string>();
    for (const node of nodes) {
      if (node.nodeType === "ImportDirective") {
        const absolutePath = node.absolutePath;
        importPaths.add(absolutePath);
      }
    }
    result.contractImports[outputFile] = Array.from(importPaths);
  }

  const outFile = path.join(outFilePath, "verification-data.json");
  fs.mkdirSync(outFilePath, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result));
  console.log("Wrote verification data to " + outFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 