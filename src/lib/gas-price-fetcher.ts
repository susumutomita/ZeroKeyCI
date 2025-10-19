import { logger } from './logger';
import type { SupportedNetwork } from './network-config';

export interface GasPrice {
  network: SupportedNetwork;
  slow: number; // Gwei
  standard: number; // Gwei
  fast: number; // Gwei
  timestamp: number;
}

interface GasPriceCache {
  data: GasPrice;
  expiry: number;
}

interface FetchOptions {
  useFallback?: boolean;
}

interface GetAllOptions {
  continueOnError?: boolean;
}

/**
 * Service for fetching gas prices from various blockchain networks
 * Supports caching and fallback providers for reliability
 */
export class GasPriceFetcher {
  private cache: Map<SupportedNetwork, GasPriceCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 2; // Total 3 attempts (initial + 2 retries)
  private readonly RETRY_DELAY = 1000; // 1 second

  // Network-specific API endpoints
  private readonly endpoints: Record<SupportedNetwork, string> = {
    mainnet: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
    sepolia:
      'https://api-sepolia.etherscan.io/api?module=gastracker&action=gasoracle',
    polygon:
      'https://api.polygonscan.com/api?module=gastracker&action=gasoracle',
    arbitrum: 'https://api.arbiscan.io/api?module=gastracker&action=gasoracle',
    optimism:
      'https://api-optimistic.etherscan.io/api?module=gastracker&action=gasoracle',
    base: 'https://api.basescan.org/api?module=gastracker&action=gasoracle',
  };

  // Fallback endpoints (RPC-based estimation)
  private readonly fallbackEndpoints: Record<SupportedNetwork, string> = {
    mainnet: 'https://eth.llamarpc.com',
    sepolia: 'https://sepolia.infura.io/v3/public',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    base: 'https://mainnet.base.org',
  };

  /**
   * Fetch current gas prices for a specific network
   * @param network Network name
   * @param options Fetch options (e.g., use fallback)
   * @returns Gas price data
   */
  async fetchGasPrice(
    network: SupportedNetwork,
    options: FetchOptions = {}
  ): Promise<GasPrice> {
    // Check cache first
    const cached = this.getFromCache(network);
    if (cached) {
      logger.debug('Using cached gas price', { network });
      return cached;
    }

    // Validate network
    if (!this.endpoints[network]) {
      throw new Error(`Unsupported network: ${network}`);
    }

    // Try primary provider with retries
    try {
      const gasPrice = await this.fetchWithRetry(network);
      this.setCache(network, gasPrice);
      return gasPrice;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn('Primary gas price provider failed', {
        network,
        error: errorMessage,
      });

      // Try fallback if enabled
      if (options.useFallback) {
        try {
          const gasPrice = await this.fetchFromFallback(network);
          this.setCache(network, gasPrice);
          return gasPrice;
        } catch (fallbackError) {
          const fallbackErrorMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError);
          logger.error(
            'Fallback gas price provider also failed',
            fallbackError instanceof Error
              ? fallbackError
              : new Error(String(fallbackError)),
            {
              network,
            }
          );
          throw new Error(
            `Failed to fetch gas price from all providers: ${fallbackErrorMessage}`
          );
        }
      }

      throw error;
    }
  }

  /**
   * Fetch gas prices for all supported networks
   * @param options Options for fetching all prices
   * @returns Array of gas prices
   */
  async getAllGasPrices(options: GetAllOptions = {}): Promise<GasPrice[]> {
    const networks: SupportedNetwork[] = [
      'mainnet',
      'sepolia',
      'polygon',
      'arbitrum',
      'optimism',
      'base',
    ];

    const results = await Promise.allSettled(
      networks.map((network) => this.fetchGasPrice(network))
    );

    const prices: GasPrice[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        prices.push(result.value);
      } else if (!options.continueOnError) {
        throw new Error(
          `Failed to fetch gas price for one or more networks: ${result.reason}`
        );
      }
    }

    return prices;
  }

  /**
   * Format gas price for display
   * @param gasPrice Gas price data
   * @returns Formatted string
   */
  formatGasPrice(gasPrice: GasPrice): string {
    const date = new Date(gasPrice.timestamp).toISOString();
    return `Network: ${gasPrice.network}
Slow: ${gasPrice.slow} Gwei
Standard: ${gasPrice.standard} Gwei
Fast: ${gasPrice.fast} Gwei
Timestamp: ${date}`;
  }

  /**
   * Fetch gas price with automatic retry on rate limiting
   * @param network Network name
   * @returns Gas price data
   */
  private async fetchWithRetry(network: SupportedNetwork): Promise<GasPrice> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.fetchFromPrimary(network);
      } catch (error) {
        lastError = error as Error;

        // Check if it's a rate limit error (429)
        if (error instanceof Error && error.message.includes('429')) {
          if (attempt < this.MAX_RETRIES) {
            logger.warn('Rate limited, retrying...', {
              network,
              attempt: attempt + 1,
            });
            await this.delay(this.RETRY_DELAY * (attempt + 1)); // Exponential backoff
            continue;
          } else {
            // Max retries reached for rate limit
            throw new Error(
              `Failed to fetch gas price after retries: ${lastError?.message}`
            );
          }
        }

        // If not rate limit, throw immediately
        throw error;
      }
    }

    /* c8 ignore next 3 */
    // This should not be reached, but TypeScript needs it
    throw new Error(
      `Failed to fetch gas price after retries: ${lastError?.message}`
    );
  }

  /**
   * Fetch gas price from primary provider (Etherscan-like API)
   * @param network Network name
   * @returns Gas price data
   */
  private async fetchFromPrimary(network: SupportedNetwork): Promise<GasPrice> {
    const url = this.endpoints[network];
    logger.debug('Fetching gas price from primary provider', {
      network,
      url,
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch gas price: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.result) {
      throw new Error('Invalid gas price response: missing result');
    }

    const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = data.result;

    if (!SafeGasPrice || !ProposeGasPrice || !FastGasPrice) {
      throw new Error('Invalid gas price response: missing fields');
    }

    return {
      network,
      slow: parseFloat(SafeGasPrice),
      standard: parseFloat(ProposeGasPrice),
      fast: parseFloat(FastGasPrice),
      timestamp: Date.now(),
    };
  }

  /**
   * Fetch gas price from fallback provider (RPC eth_gasPrice)
   * @param network Network name
   * @returns Gas price data
   */
  private async fetchFromFallback(
    network: SupportedNetwork
  ): Promise<GasPrice> {
    const url = this.fallbackEndpoints[network];
    logger.debug('Fetching gas price from fallback provider', {
      network,
      url,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch gas price from fallback: ${response.status}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }

    // Convert hex gas price (wei) to Gwei
    const gasPriceWei = parseInt(data.result, 16);
    const gasPriceGwei = gasPriceWei / 1e9;

    // Estimate slow/standard/fast based on current price
    // Fallback provides single price, so we estimate ranges
    return {
      network,
      slow: gasPriceGwei * 0.8, // 80% of current
      standard: gasPriceGwei, // Current price
      fast: gasPriceGwei * 1.2, // 120% of current
      timestamp: Date.now(),
    };
  }

  /**
   * Get gas price from cache if not expired
   * @param network Network name
   * @returns Cached gas price or null
   */
  private getFromCache(network: SupportedNetwork): GasPrice | null {
    const cached = this.cache.get(network);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(network);
      return null;
    }

    return cached.data;
  }

  /**
   * Set gas price in cache
   * @param network Network name
   * @param gasPrice Gas price data
   */
  private setCache(network: SupportedNetwork, gasPrice: GasPrice): void {
    this.cache.set(network, {
      data: gasPrice,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Delay helper for retries
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
