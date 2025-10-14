/**
 * Environment variable validation and configuration
 */

export interface EnvConfig {
  safeAddress: string;
  storageType: 'file' | 'memory';
  storageDir?: string;
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * Validate and get environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'production'
    | 'test';

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
