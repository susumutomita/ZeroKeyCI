import { logger } from './logger';
import type { SupportedNetwork } from './network-config';
import type { GasEstimate } from './gas-estimator';
import type { Hex, PublicClient, WalletClient } from 'viem';

/**
 * Result of deployment simulation
 */
export interface SimulationResult {
  network: SupportedNetwork;
  success: boolean;
  actualGasUsed: number;
  deploymentAddress?: string;
  error?: string;
  gasBreakdown: {
    baseCost: number;
    deploymentCost: number;
  };
  timestamp: number;
}

/**
 * Comparison between estimated and actual gas usage
 */
export interface GasComparison {
  estimatedGas: number;
  actualGas: number;
  difference: number; // actual - estimated
  accuracyPercent: number; // 100 - (|difference| / actual * 100)
  withinTolerance: boolean; // true if within 10%
}

/**
 * Options for deployment simulation
 */
interface SimulationOptions {
  /** Target network for simulation (defaults to 'sepolia') */
  network?: SupportedNetwork;
  /**
   * Constructor arguments for contract deployment
   * @warning Only supports simple types (addresses, numbers, hex strings)
   * @warning Complex types (arrays, structs, strings) are NOT properly ABI-encoded
   * @see https://docs.soliditylang.org/en/latest/abi-spec.html
   */
  constructorArgs?: any[];
  /** ETH value to send with deployment (in wei) */
  value?: bigint;
  /** Allow dependency injection for testing */
  publicClient?: PublicClient;
  /** Allow dependency injection for testing */
  walletClient?: WalletClient;
}

/**
 * Service for simulating contract deployments to measure actual gas usage
 * Uses Hardhat Network for local simulation
 */
export class DeploymentSimulator {
  /**
   * Tolerance threshold for gas estimation accuracy (10%)
   * Simulation is considered accurate if actual gas is within this percentage of estimate
   */
  private readonly TOLERANCE_THRESHOLD = 0.1;

  /**
   * Base transaction cost in gas
   */
  private readonly BASE_TX_COST = 21000;

  /**
   * Simulate contract deployment and measure actual gas usage
   * @param bytecode Contract bytecode (with 0x prefix)
   * @param options Simulation options
   * @returns Simulation result with actual gas used
   */
  async simulateDeployment(
    bytecode: string,
    options: SimulationOptions = {}
  ): Promise<SimulationResult> {
    const network = options.network || 'sepolia';
    const timestamp = Date.now();

    logger.debug('Starting deployment simulation', {
      network,
      bytecodeLength: bytecode.length,
      hasConstructorArgs: !!options.constructorArgs,
    });

    try {
      // Validate bytecode
      if (!bytecode || !bytecode.startsWith('0x')) {
        throw new Error('Invalid bytecode: must start with 0x');
      }

      // Get viem clients (either injected for testing or from hre)
      let publicClient = options.publicClient;
      let walletClient = options.walletClient;

      /* c8 ignore start - hardhat fallback tested via integration tests */
      if (!publicClient || !walletClient) {
        // Dynamically import hardhat to avoid errors in non-hardhat environments
        const hre = await import('hardhat').then((m) => m.default);
        const viemHelpers = (hre as any).viem;
        publicClient = (await viemHelpers.getPublicClient()) as PublicClient;
        const [wallet] = await viemHelpers.getWalletClients();
        walletClient = wallet as WalletClient;
      }
      /* c8 ignore stop */

      logger.debug('Got Hardhat network clients');

      /* c8 ignore start - defensive check, unreachable after initialization */
      // Ensure clients are defined
      if (!publicClient || !walletClient) {
        throw new Error('Failed to initialize viem clients');
      }
      /* c8 ignore stop */

      // Prepare deployment transaction
      let deploymentData = bytecode as Hex;

      // Add constructor arguments if provided
      if (options.constructorArgs && options.constructorArgs.length > 0) {
        /**
         * IMPORTANT: This is a simplified constructor argument encoding for simulation purposes.
         * Limitations:
         * - Only supports simple types (addresses, uint256, hex strings)
         * - Does NOT follow Ethereum ABI encoding specification
         * - Will NOT work correctly with: arrays, structs, strings, or complex types
         *
         * For production use or accurate gas estimation with complex constructors,
         * consider using viem's encodeAbiParameters with proper type definitions.
         *
         * Example proper encoding:
         * import { encodeAbiParameters, parseAbiParameters } from 'viem';
         * const encoded = encodeAbiParameters(
         *   parseAbiParameters('address, uint256'),
         *   [address, amount]
         * );
         */
        const argsHex = options.constructorArgs
          .map((arg) => {
            if (typeof arg === 'string' && arg.startsWith('0x')) {
              // Already hex-encoded (e.g., address)
              return arg.slice(2);
            }
            if (typeof arg === 'number' || typeof arg === 'bigint') {
              // Encode as uint256 (32 bytes)
              const num = typeof arg === 'bigint' ? arg : BigInt(arg);
              return num.toString(16).padStart(64, '0');
            }
            // Fallback: convert to string and assume it's a hex value
            const str = String(arg);
            return str.startsWith('0x') ? str.slice(2) : str;
          })
          .join('');
        deploymentData = (bytecode + argsHex) as Hex;
      }

      // Simulate deployment
      // Note: Empty ABI is acceptable for simulation purposes
      // Type assertion needed because viem's deployContract expects a non-empty ABI tuple
      const hash = (await walletClient.deployContract({
        abi: [],
        bytecode: deploymentData,
        value: options.value || BigInt(0),
      } as any)) as Hex;

      logger.debug('Deployment transaction sent', { hash });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      logger.debug('Deployment transaction confirmed', {
        contractAddress: receipt.contractAddress,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
      });

      if (receipt.status !== 'success') {
        throw new Error('Deployment transaction failed');
      }

      const actualGasUsed = Number(receipt.gasUsed);

      // Calculate gas breakdown
      const baseCost = this.BASE_TX_COST;
      const deploymentCost = actualGasUsed - baseCost;

      logger.info('Deployment simulation completed successfully', {
        network,
        actualGasUsed,
        contractAddress: receipt.contractAddress,
      });

      return {
        network,
        success: true,
        actualGasUsed,
        deploymentAddress: receipt.contractAddress || undefined,
        gasBreakdown: {
          baseCost,
          deploymentCost,
        },
        timestamp,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      logger.error(`Deployment simulation failed for ${network}`, errorObj);

      return {
        network,
        success: false,
        actualGasUsed: 0,
        error: errorMessage,
        gasBreakdown: {
          baseCost: 0,
          deploymentCost: 0,
        },
        timestamp,
      };
    }
  }

  /**
   * Compare simulated gas usage with estimated gas
   * @param simulation Simulation result
   * @param estimate Gas estimate
   * @returns Comparison result
   */
  compareWithEstimate(
    simulation: SimulationResult,
    estimate: GasEstimate
  ): GasComparison {
    const estimatedGas = estimate.deploymentGas;
    const actualGas = simulation.actualGasUsed;
    const difference = actualGas - estimatedGas;
    const accuracyPercent =
      actualGas > 0 ? 100 - (Math.abs(difference) / actualGas) * 100 : 0;
    const withinTolerance =
      Math.abs(difference) < actualGas * this.TOLERANCE_THRESHOLD;

    logger.debug('Gas comparison completed', {
      estimatedGas,
      actualGas,
      difference,
      accuracyPercent: accuracyPercent.toFixed(2),
      withinTolerance,
    });

    return {
      estimatedGas,
      actualGas,
      difference,
      accuracyPercent,
      withinTolerance,
    };
  }

  /**
   * Format simulation result for display
   * @param simulation Simulation result
   * @returns Formatted string
   */
  formatResult(simulation: SimulationResult): string {
    if (!simulation.success) {
      return `Simulation failed: ${simulation.error}`;
    }

    return `Deployment Simulation Result:
Network: ${simulation.network}
Contract Address: ${simulation.deploymentAddress}
Actual Gas Used: ${simulation.actualGasUsed.toLocaleString()}

Gas Breakdown:
  - Base Transaction Cost: ${simulation.gasBreakdown.baseCost.toLocaleString()} gas
  - Deployment Cost: ${simulation.gasBreakdown.deploymentCost.toLocaleString()} gas`;
  }

  /**
   * Format gas comparison for display
   * @param comparison Gas comparison
   * @returns Formatted string
   */
  formatComparison(comparison: GasComparison): string {
    const sign = comparison.difference >= 0 ? '+' : '';
    const toleranceStatus = comparison.withinTolerance ? '✓' : '✗';
    const percentageDiff =
      comparison.actualGas > 0
        ? `${sign}${((comparison.difference / comparison.actualGas) * 100).toFixed(2)}%`
        : 'N/A';

    return `Gas Estimation Accuracy Report:
Estimated Gas: ${comparison.estimatedGas.toLocaleString()}
Actual Gas Used: ${comparison.actualGas.toLocaleString()}
Difference: ${sign}${comparison.difference.toLocaleString()} (${percentageDiff})
Accuracy: ${comparison.accuracyPercent.toFixed(2)}%
Within ${(this.TOLERANCE_THRESHOLD * 100).toFixed(0)}% Tolerance: ${toleranceStatus} ${comparison.withinTolerance ? 'Yes' : 'No'}`;
  }
}
