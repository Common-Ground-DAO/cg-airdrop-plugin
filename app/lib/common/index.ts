export function getEtherscanUrls(chainId: number): string[] {
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

export function getBlockscoutBaseUrls(chainId: number): string[] {
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