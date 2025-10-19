import { logger } from './logger';
import type { SupportedNetwork } from './network-config';
import type { GasPrice } from './gas-price-fetcher';

/**
 * Breakdown of gas costs for deployment
 */
export interface GasBreakdown {
  baseCost: number; // Base transaction cost (21,000 gas)
  creationCost: number; // Contract creation cost (32,000 gas)
  codeStorage: number; // Cost to store bytecode (200 gas per byte)
  constructorData: number; // Cost for constructor arguments
}

/**
 * Gas estimation for contract deployment
 */
export interface GasEstimate {
  network: SupportedNetwork;
  bytecodeSize: number; // Size in bytes
  deploymentGas: number; // Total estimated gas
  breakdown: GasBreakdown;
  costInWei?: string; // Cost in wei (when gas price provided)
  costInEther?: string; // Cost in ether
  costInUSD?: string; // Cost in USD (when ETH price provided)
}

/**
 * Estimate with gas price information
 */
export interface GasEstimateWithPrice extends GasEstimate {
  gasPrice: GasPrice;
  tier: 'slow' | 'standard' | 'fast';
  ethPriceUSD?: number;
}

/**
 * Bytecode analysis result
 */
export interface BytecodeAnalysis {
  size: number; // Size in hex characters
  sizeInBytes: number; // Size in bytes
  hasConstructor: boolean; // Whether constructor exists
  complexity: number; // Complexity score (0-100)
}

/**
 * Network comparison result
 */
export interface NetworkComparison {
  bytecode: string;
  estimates: GasEstimateWithPrice[];
  cheapest: GasEstimateWithPrice;
  mostExpensive: GasEstimateWithPrice;
}

interface EstimateOptions {
  network?: SupportedNetwork;
  constructorArgs?: string[];
}

interface EstimateWithPriceOptions {
  tier: 'slow' | 'standard' | 'fast';
  ethPriceUSD?: number;
}

interface CompareOptions {
  tier?: 'slow' | 'standard' | 'fast';
  sortBy?: 'cost' | 'gas' | 'network';
}

/**
 * Service for estimating gas costs for contract deployment
 * Analyzes bytecode and calculates deployment costs
 */
export class GasEstimator {
  // Gas cost constants (based on Ethereum yellow paper)
  private readonly BASE_TX_COST = 21000; // Base transaction cost
  private readonly CONTRACT_CREATION_COST = 32000; // Contract creation overhead
  private readonly CODE_DEPOSIT_COST = 200; // Cost per byte of deployed code
  private readonly CALLDATA_ZERO_BYTE = 4; // Cost for zero byte in calldata
  private readonly CALLDATA_NONZERO_BYTE = 16; // Cost for non-zero byte in calldata

  /**
   * Estimate gas required for contract deployment
   * @param bytecode Contract bytecode (with 0x prefix)
   * @param options Estimation options
   * @returns Gas estimation
   */
  estimateDeployment(
    bytecode: string,
    options: EstimateOptions = {}
  ): GasEstimate {
    // Validate bytecode
    if (!bytecode || bytecode.length === 0) {
      throw new Error('Invalid bytecode: empty bytecode');
    }

    if (!bytecode.startsWith('0x')) {
      throw new Error('Invalid bytecode: must start with 0x');
    }

    // Remove 0x prefix and validate hex
    const cleanBytecode = bytecode.slice(2);
    if (!/^[0-9a-fA-F]*$/.test(cleanBytecode)) {
      throw new Error('Invalid bytecode: not valid hex');
    }

    const network = options.network || 'sepolia';

    // Calculate bytecode size
    const bytecodeSize = cleanBytecode.length / 2; // 2 hex chars = 1 byte

    logger.debug('Analyzing bytecode for gas estimation', {
      network,
      bytecodeSize,
    });

    // Calculate gas costs
    const baseCost = this.BASE_TX_COST;
    const creationCost = this.CONTRACT_CREATION_COST;
    const codeStorage = bytecodeSize * this.CODE_DEPOSIT_COST;

    // Calculate constructor data cost if constructor args provided
    let constructorData = 0;
    if (options.constructorArgs && options.constructorArgs.length > 0) {
      // Estimate: assume each arg is ~32 bytes (uint256/address)
      // Use a realistic mix of zero and non-zero bytes for estimation
      // Assume ~50% zero bytes, 50% non-zero bytes
      const estimatedArgBytes = options.constructorArgs.length * 32;
      const mockData =
        '0x' +
        Array.from({ length: estimatedArgBytes }, (_, i) =>
          i % 2 === 0 ? '00' : 'ff'
        ).join('');
      constructorData = this.estimateCalldataCost(mockData);
    }

    const deploymentGas =
      baseCost + creationCost + codeStorage + constructorData;

    logger.debug('Gas estimation completed', {
      network,
      deploymentGas,
      breakdown: { baseCost, creationCost, codeStorage, constructorData },
    });

    return {
      network,
      bytecodeSize,
      deploymentGas,
      breakdown: {
        baseCost,
        creationCost,
        codeStorage,
        constructorData,
      },
    };
  }

  /**
   * Estimate deployment cost with gas price
   * @param bytecode Contract bytecode
   * @param gasPrice Current gas price
   * @param options Estimation options
   * @param network Optional network override
   * @returns Gas estimation with cost
   */
  estimateWithPrice(
    bytecode: string,
    gasPrice: GasPrice,
    options: EstimateWithPriceOptions,
    network?: SupportedNetwork
  ): GasEstimateWithPrice {
    const targetNetwork = network || gasPrice.network;

    // Check network mismatch
    if (network && network !== gasPrice.network) {
      throw new Error(
        `Network mismatch: requested ${network} but gas price is for ${gasPrice.network}`
      );
    }

    // Get base gas estimate
    const gasEstimate = this.estimateDeployment(bytecode, {
      network: targetNetwork,
    });

    // Get gas price for selected tier
    const gasPriceGwei = gasPrice[options.tier];

    // Calculate cost in wei (gas * gasPrice in Gwei * 1e9 to convert to wei)
    const costInWei = (
      BigInt(gasEstimate.deploymentGas) * BigInt(Math.floor(gasPriceGwei * 1e9))
    ).toString();

    // Convert to ether
    const costInEther = (Number(costInWei) / 1e18).toFixed(6);

    // Calculate USD cost if ETH price provided
    let costInUSD: string | undefined;
    if (options.ethPriceUSD) {
      const usdCost = Number(costInEther) * options.ethPriceUSD;
      costInUSD = usdCost.toFixed(2);
    }

    logger.debug('Gas cost estimation with price', {
      network: targetNetwork,
      tier: options.tier,
      gasPriceGwei,
      costInEther,
      costInUSD,
    });

    return {
      ...gasEstimate,
      gasPrice,
      tier: options.tier,
      costInWei,
      costInEther,
      costInUSD,
      ethPriceUSD: options.ethPriceUSD,
    };
  }

  /**
   * Analyze bytecode structure
   * @param bytecode Contract bytecode
   * @returns Bytecode analysis
   */
  analyzeBytecode(bytecode: string): BytecodeAnalysis {
    const cleanBytecode = bytecode.startsWith('0x')
      ? bytecode.slice(2)
      : bytecode;

    const size = cleanBytecode.length;
    const sizeInBytes = size / 2;

    // Simple heuristic: check if there's constructor code
    // Constructor typically appears near the beginning of bytecode
    // This is a simplified check - actual constructor detection is complex
    const hasConstructor =
      cleanBytecode.includes('604051') || // Common constructor pattern
      cleanBytecode.includes('60405180');

    // Calculate complexity score based on bytecode size and unique opcodes
    // Simplified: larger = more complex
    const complexity = Math.min(100, Math.floor((sizeInBytes / 100) * 10));

    logger.debug('Bytecode analysis completed', {
      size,
      sizeInBytes,
      hasConstructor,
      complexity,
    });

    return {
      size,
      sizeInBytes,
      hasConstructor,
      complexity,
    };
  }

  /**
   * Format gas estimate for display
   * @param estimate Gas estimate
   * @returns Formatted string
   */
  formatEstimate(estimate: GasEstimate): string {
    let output = `Network: ${estimate.network}
Bytecode Size: ${estimate.bytecodeSize} bytes
Estimated Gas: ${estimate.deploymentGas.toLocaleString()}

Breakdown:
  - Base Transaction Cost: ${estimate.breakdown.baseCost.toLocaleString()} gas
  - Contract Creation Cost: ${estimate.breakdown.creationCost.toLocaleString()} gas
  - Code Storage Cost: ${estimate.breakdown.codeStorage.toLocaleString()} gas`;

    if (estimate.breakdown.constructorData > 0) {
      output += `\n  - Constructor Data Cost: ${estimate.breakdown.constructorData.toLocaleString()} gas`;
    }

    if (estimate.costInEther) {
      output += `\n\nEstimated Cost: ${estimate.costInEther} ETH`;
    }

    if (estimate.costInUSD) {
      output += ` ($${estimate.costInUSD} USD)`;
    }

    return output;
  }

  /**
   * Compare deployment costs across multiple networks
   * @param bytecode Contract bytecode
   * @param gasPrices Gas prices for different networks
   * @param options Comparison options
   * @returns Network comparison
   */
  compareNetworks(
    bytecode: string,
    gasPrices: GasPrice[],
    options: CompareOptions = {}
  ): NetworkComparison {
    const tier = options.tier || 'standard';

    // Estimate for each network
    const estimates = gasPrices.map((gasPrice) =>
      this.estimateWithPrice(bytecode, gasPrice, { tier })
    );

    // Sort if requested
    if (options.sortBy === 'cost') {
      estimates.sort((a, b) =>
        Number(BigInt(a.costInWei!) - BigInt(b.costInWei!))
      );
    } else if (options.sortBy === 'gas') {
      estimates.sort((a, b) => a.deploymentGas - b.deploymentGas);
    } else if (options.sortBy === 'network') {
      estimates.sort((a, b) => a.network.localeCompare(b.network));
    }

    // Find cheapest and most expensive
    const cheapest = estimates.reduce((min, curr) =>
      BigInt(curr.costInWei!) < BigInt(min.costInWei!) ? curr : min
    );

    const mostExpensive = estimates.reduce((max, curr) =>
      BigInt(curr.costInWei!) > BigInt(max.costInWei!) ? curr : max
    );

    logger.info('Network comparison completed', {
      networkCount: estimates.length,
      cheapest: cheapest.network,
      mostExpensive: mostExpensive.network,
    });

    return {
      bytecode,
      estimates,
      cheapest,
      mostExpensive,
    };
  }

  /**
   * Estimate calldata cost
   * @param data Calldata hex string
   * @returns Estimated gas cost
   */
  private estimateCalldataCost(data: string): number {
    const cleanData = data.startsWith('0x') ? data.slice(2) : data;
    let cost = 0;

    // Count zero and non-zero bytes
    for (let i = 0; i < cleanData.length; i += 2) {
      const byte = cleanData.slice(i, i + 2);
      if (byte === '00') {
        cost += this.CALLDATA_ZERO_BYTE;
      } else {
        cost += this.CALLDATA_NONZERO_BYTE;
      }
    }

    return cost;
  }
}
