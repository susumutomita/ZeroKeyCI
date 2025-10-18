/**
 * Network configuration for different chains
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl?: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export type SupportedNetwork =
  | 'mainnet'
  | 'sepolia'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base';

/**
 * Network configurations for supported chains
 */
export const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    explorerUrl: 'https://etherscan.io',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia Testnet',
    explorerUrl: 'https://sepolia.etherscan.io',
    currency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    currency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    testnet: false,
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    explorerUrl: 'https://arbiscan.io',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    explorerUrl: 'https://optimistic.etherscan.io',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  base: {
    chainId: 8453,
    name: 'Base',
    explorerUrl: 'https://basescan.org',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
};

/**
 * Get network configuration by name
 */
export function getNetworkConfig(network: SupportedNetwork): NetworkConfig {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return config;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | null {
  for (const config of Object.values(NETWORK_CONFIGS)) {
    if (config.chainId === chainId) {
      return config;
    }
  }
  return null;
}

/**
 * Get network name by chain ID
 */
export function getNetworkName(chainId: number): SupportedNetwork | null {
  for (const [name, config] of Object.entries(NETWORK_CONFIGS)) {
    if (config.chainId === chainId) {
      return name as SupportedNetwork;
    }
  }
  return null;
}

/**
 * Check if a network is a testnet
 */
export function isTestnet(network: SupportedNetwork): boolean {
  return NETWORK_CONFIGS[network].testnet;
}

/**
 * Get all supported network names
 */
export function getSupportedNetworks(): SupportedNetwork[] {
  return Object.keys(NETWORK_CONFIGS) as SupportedNetwork[];
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(NETWORK_CONFIGS).map((config) => config.chainId);
}

/**
 * Validate if a chain ID is supported
 */
export function isSupportedChainId(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId);
}

/**
 * Get RPC URL for a network from environment variables
 */
export function getRpcUrl(network: SupportedNetwork): string | undefined {
  const envVar = `${network.toUpperCase()}_RPC_URL`;
  return process.env[envVar];
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(
  network: SupportedNetwork,
  address: string
): string {
  const config = getNetworkConfig(network);
  return `${config.explorerUrl}/address/${address}`;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(
  network: SupportedNetwork,
  txHash: string
): string {
  const config = getNetworkConfig(network);
  return `${config.explorerUrl}/tx/${txHash}`;
}
