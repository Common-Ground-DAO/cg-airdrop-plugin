require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@typechain/hardhat");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  typechain: {
    outDir: "../app/contracts",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    dontOverrideCompile: false
  },
  paths: {
    artifacts: "./artifacts",
  }
};
