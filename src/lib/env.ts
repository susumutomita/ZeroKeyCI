/**
 * Environment variable validation and configuration
 */

import type { SupportedNetwork } from './network-config';
import {
  getNetworkConfig,
  isSupportedChainId,
  getRpcUrl as getNetworkRpcUrl,
} from './network-config';

export interface EnvConfig {
  safeAddress: string;
  storageType: 'file' | 'memory';
  storageDir?: string;
  nodeEnv: 'development' | 'production' | 'test';
  network: SupportedNetwork;
  chainId?: number;
}

/**
 * Validate and get environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'production'
    | 'test';

  // Network configuration
  const network = (process.env.NETWORK || 'sepolia') as SupportedNetwork;
  let chainId = process.env.CHAIN_ID
    ? parseInt(process.env.CHAIN_ID)
    : undefined;

  // Auto-detect chainId from network if not specified
  if (!chainId) {
    try {
      const networkConfig = getNetworkConfig(network);
      chainId = networkConfig.chainId;
    } catch (error) {
      throw new Error(
        `Invalid NETWORK: ${network}. Supported networks: mainnet, sepolia, polygon, arbitrum, optimism, base`
      );
    }
  }

  // Validate chainId is supported
  if (chainId && !isSupportedChainId(chainId)) {
    throw new Error(
      `Unsupported CHAIN_ID: ${chainId}. Supported chain IDs: 1 (mainnet), 11155111 (sepolia), 137 (polygon), 42161 (arbitrum), 10 (optimism), 8453 (base)`
    );
  }

  // In production, SAFE_ADDRESS must be set
  let safeAddress = process.env.SAFE_ADDRESS;

  if (!safeAddress) {
    if (nodeEnv === 'production') {
      throw new Error(
        'SAFE_ADDRESS environment variable is required in production. ' +
          'Please set it to your Gnosis Safe multisig address.'
      );
    }

    // Use demo address for development/testing
    console.warn(
      'WARNING: Using demo Safe address. Set SAFE_ADDRESS environment variable for production.'
    );
    safeAddress = '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0';
  }

  // Validate Safe address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(safeAddress)) {
    throw new Error(
      `Invalid SAFE_ADDRESS format: ${safeAddress}. Must be a valid Ethereum address.`
    );
  }

  const storageType = (process.env.STORAGE_TYPE || 'file') as 'file' | 'memory';
  const storageDir = process.env.STORAGE_DIR;

  return {
    safeAddress,
    storageType,
    storageDir,
    nodeEnv,
    network,
    chainId,
  };
}

/**
 * Get Safe address with validation
 */
export function getSafeAddress(): string {
  const config = getEnvConfig();
  return config.safeAddress;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvConfig().nodeEnv === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvConfig().nodeEnv === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvConfig().nodeEnv === 'test';
}

/**
 * Get current network
 */
export function getNetwork(): SupportedNetwork {
  return getEnvConfig().network;
}

/**
 * Get current chain ID
 */
export function getChainId(): number {
  const config = getEnvConfig();
  // chainId is always set via auto-detection in getEnvConfig
  return config.chainId!;
}

/**
 * Get RPC URL for current network
 */
export function getRpcUrl(network?: SupportedNetwork): string | undefined {
  const targetNetwork = network || getNetwork();
  return getNetworkRpcUrl(targetNetwork);
}

/**
 * Validate that required environment variables are set for deployment
 */
export function validateDeploymentEnv(): void {
  const config = getEnvConfig();

  // Validate Safe address is set
  if (!process.env.SAFE_ADDRESS) {
    throw new Error('SAFE_ADDRESS must be set for deployments');
  }

  // Validate RPC URL is set for the network
  const rpcUrl = getRpcUrl(config.network);
  if (!rpcUrl) {
    const envVar = `${config.network.toUpperCase()}_RPC_URL`;
    console.warn(
      `Warning: ${envVar} not set. Some features may not work without an RPC URL.`
    );
  }

  // Network configuration is already validated in getEnvConfig
  // No additional validation needed here
}
