import { logger } from './logger';
import type { GasPriceFetcher, GasPrice } from './gas-price-fetcher';
import type {
  GasEstimator,
  GasEstimateWithPrice,
  NetworkComparison as EstimatorNetworkComparison,
} from './gas-estimator';
import type {
  DeploymentSimulator,
  SimulationResult,
  GasComparison,
} from './deployment-simulator';
import type { SupportedNetwork } from './network-config';

/**
 * Optimization recommendation types
 */
export type RecommendationType =
  | 'bytecode_size'
  | 'high_cost'
  | 'cheaper_network'
  | 'timing'
  | 'gas_optimization'
  | 'constructor_optimization';

/**
 * Recommendation severity levels
 */
export type RecommendationSeverity = 'info' | 'low' | 'medium' | 'high';

/**
 * Individual optimization recommendation
 */
export interface OptimizationRecommendation {
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  potentialSavings?: string; // e.g., "Save up to 15% gas"
  actionItems?: string[];
}

/**
 * Network cost comparison result
 */
export interface NetworkCostComparison {
  network: SupportedNetwork;
  estimatedCost: string; // USD
  estimatedGas: number;
}

/**
 * Network comparison summary
 */
export interface NetworkComparisonSummary {
  networks: NetworkCostComparison[];
  cheapest: NetworkCostComparison;
  mostExpensive: NetworkCostComparison;
  savings: number; // USD savings from cheapest to most expensive
}

/**
 * Options for report generation
 */
export interface ReportOptions {
  network: SupportedNetwork;
  includeSimulation?: boolean;
  compareNetworks?: SupportedNetwork[];
  constructorArgs?: any[];
  value?: bigint;
}

/**
 * Report output format
 */
export type ReportFormat = 'cli' | 'ci' | 'json';

/**
 * Comprehensive optimization report
 */
export interface OptimizationReport {
  bytecode: string;
  primaryNetwork: SupportedNetwork;
  estimate: GasEstimateWithPrice;
  simulation?: {
    result: SimulationResult;
    comparison: GasComparison;
  };
  networkComparison?: NetworkComparisonSummary;
  recommendations: OptimizationRecommendation[];
  optimizationScore: number; // 0-100, higher is better
  timestamp: number;
}

/**
 * Service for generating comprehensive gas optimization reports
 * Combines data from GasPriceFetcher, GasEstimator, and DeploymentSimulator
 */
export class OptimizationReporter {
  constructor(
    private gasPriceFetcher: GasPriceFetcher,
    private gasEstimator: GasEstimator,
    private deploymentSimulator: DeploymentSimulator
  ) {}

  /**
   * Generate comprehensive optimization report
   * @param bytecode Contract bytecode
   * @param options Report generation options
   * @returns Complete optimization report
   */
  async generateReport(
    bytecode: string,
    options: ReportOptions
  ): Promise<OptimizationReport> {
    logger.info('Generating optimization report', {
      network: options.network,
      includeSimulation: options.includeSimulation,
      compareNetworks: options.compareNetworks?.length || 0,
    });

    // Step 1: Get gas price and estimate
    const gasPrice = await this.gasPriceFetcher.fetchGasPrice(options.network);
    const estimate = this.gasEstimator.estimateWithPrice(bytecode, gasPrice, {
      tier: 'standard',
    });

    logger.debug('Gas estimate calculated', {
      deploymentGas: estimate.deploymentGas,
      costInUSD: estimate.costInUSD,
    });

    // Step 2: Run simulation if requested
    let simulation:
      | { result: SimulationResult; comparison: GasComparison }
      | undefined;
    if (options.includeSimulation) {
      const simResult = await this.deploymentSimulator.simulateDeployment(
        bytecode,
        {
          network: options.network,
          constructorArgs: options.constructorArgs,
          value: options.value,
        }
      );

      const comparison = this.deploymentSimulator.compareWithEstimate(
        simResult,
        estimate
      );

      simulation = { result: simResult, comparison };

      logger.debug('Simulation completed', {
        actualGas: simResult.actualGasUsed,
        accuracy: comparison.accuracyPercent,
      });
    }

    // Step 3: Compare networks if requested
    let networkComparison: NetworkComparisonSummary | undefined;
    if (options.compareNetworks && options.compareNetworks.length > 0) {
      networkComparison = await this.compareNetworks(
        bytecode,
        options.compareNetworks,
        options.constructorArgs
      );

      logger.debug('Network comparison completed', {
        networkCount: networkComparison.networks.length,
        cheapest: networkComparison.cheapest.network,
      });
    }

    // Step 4: Generate recommendations
    const recommendations = this.generateRecommendations(
      estimate,
      simulation,
      networkComparison,
      options.network
    );

    // Step 5: Calculate optimization score
    const optimizationScore = this.calculateOptimizationScore(
      estimate,
      simulation
    );

    const report: OptimizationReport = {
      bytecode,
      primaryNetwork: options.network,
      estimate,
      simulation,
      networkComparison,
      recommendations,
      optimizationScore,
      timestamp: Date.now(),
    };

    logger.info('Optimization report generated', {
      recommendationCount: recommendations.length,
      optimizationScore,
    });

    return report;
  }

  /**
   * Compare deployment costs across multiple networks
   * @param bytecode Contract bytecode
   * @param networks Networks to compare
   * @param constructorArgs Optional constructor arguments
   * @returns Network comparison summary
   */
  async compareNetworks(
    bytecode: string,
    networks: SupportedNetwork[],
    constructorArgs?: any[]
  ): Promise<NetworkComparisonSummary> {
    logger.debug('Comparing networks', { networkCount: networks.length });

    const comparisons: NetworkCostComparison[] = [];

    for (const network of networks) {
      const gasPrice = await this.gasPriceFetcher.fetchGasPrice(network);
      const estimate = this.gasEstimator.estimateWithPrice(bytecode, gasPrice, {
        tier: 'standard',
      });

      comparisons.push({
        network,
        estimatedCost: estimate.costInUSD || '0',
        estimatedGas: estimate.deploymentGas,
      });
    }

    // Sort by cost (ascending)
    comparisons.sort(
      (a, b) => parseFloat(a.estimatedCost) - parseFloat(b.estimatedCost)
    );

    const cheapest = comparisons[0];
    const mostExpensive = comparisons[comparisons.length - 1];
    const savings =
      parseFloat(mostExpensive.estimatedCost) -
      parseFloat(cheapest.estimatedCost);

    return {
      networks: comparisons,
      cheapest,
      mostExpensive,
      savings,
    };
  }

  /**
   * Generate optimization recommendations based on report data
   * @param estimate Gas estimate
   * @param simulation Optional simulation result
   * @param networkComparison Optional network comparison
   * @param primaryNetwork Primary network being analyzed
   * @returns List of recommendations
   */
  private generateRecommendations(
    estimate: GasEstimateWithPrice,
    simulation:
      | { result: SimulationResult; comparison: GasComparison }
      | undefined,
    networkComparison: NetworkComparisonSummary | undefined,
    primaryNetwork: SupportedNetwork
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Recommendation 1: Large bytecode size
    const MAX_BYTECODE_SIZE = 24576; // Ethereum max contract size
    const LARGE_BYTECODE_THRESHOLD = 20000; // 80% of max

    if (estimate.bytecodeSize > LARGE_BYTECODE_THRESHOLD) {
      const percentOfMax = (
        (estimate.bytecodeSize / MAX_BYTECODE_SIZE) *
        100
      ).toFixed(1);
      recommendations.push({
        type: 'bytecode_size',
        severity: 'high',
        title: 'Large Contract Size',
        description: `Contract bytecode is ${estimate.bytecodeSize.toLocaleString()} bytes (${percentOfMax}% of maximum). Large contracts are expensive to deploy and may approach the 24KB limit.`,
        potentialSavings:
          'Reduce size by 20-50% to save 20-50% on deployment costs',
        actionItems: [
          'Use libraries for shared code',
          'Remove unused functions and variables',
          'Optimize data structures',
          'Consider splitting into multiple contracts',
          'Use proxy patterns for upgradeability',
        ],
      });
    }

    // Recommendation 2: High deployment cost
    const HIGH_COST_THRESHOLD = 50; // USD
    const MEDIUM_COST_THRESHOLD = 20; // USD
    const costUSD = parseFloat(estimate.costInUSD || '0');

    if (costUSD > HIGH_COST_THRESHOLD) {
      recommendations.push({
        type: 'high_cost',
        severity: 'high',
        title: 'High Deployment Cost',
        description: `Deployment will cost approximately $${estimate.costInUSD} on ${estimate.network}. This is significantly higher than average.`,
        actionItems: [
          'Consider deploying on a cheaper network (see network comparison)',
          'Wait for lower gas prices',
          'Optimize contract bytecode size',
          'Review constructor logic for gas savings',
        ],
      });
    } else if (costUSD > MEDIUM_COST_THRESHOLD) {
      recommendations.push({
        type: 'high_cost',
        severity: 'medium',
        title: 'Moderate Deployment Cost',
        description: `Deployment will cost approximately $${estimate.costInUSD} on ${estimate.network}.`,
        actionItems: [
          'Consider deploying during off-peak hours for lower gas prices',
          'Review network comparison for cheaper alternatives',
        ],
      });
    }

    // Recommendation 3: Cheaper network available
    if (
      networkComparison &&
      networkComparison.cheapest.network !== primaryNetwork &&
      networkComparison.savings > 5
    ) {
      recommendations.push({
        type: 'cheaper_network',
        severity: 'medium',
        title: 'Cheaper Network Available',
        description: `Deploying on ${networkComparison.cheapest.network} would save approximately $${networkComparison.savings.toFixed(2)} compared to ${networkComparison.mostExpensive.network}.`,
        potentialSavings: `Save $${networkComparison.savings.toFixed(2)} (${((networkComparison.savings / parseFloat(networkComparison.mostExpensive.estimatedCost)) * 100).toFixed(1)}%)`,
        actionItems: [
          `Consider deploying on ${networkComparison.cheapest.network}`,
          'Verify network requirements match your use case',
          'Check if target users are on the cheaper network',
        ],
      });
    }

    // Recommendation 4: High gas prices (timing)
    const standardGwei = Number(estimate.gasPrice.standard);
    const HIGH_GAS_THRESHOLD = 100; // gwei

    if (standardGwei > HIGH_GAS_THRESHOLD) {
      recommendations.push({
        type: 'timing',
        severity: 'medium',
        title: 'High Gas Prices',
        description: `Current gas prices are ${standardGwei} gwei, which is above average. Waiting for lower prices could reduce costs.`,
        potentialSavings: 'Save 20-40% by deploying during off-peak hours',
        actionItems: [
          'Monitor gas prices and deploy during off-peak times',
          'Use gas price prediction tools',
          'Consider scheduling deployment for weekends',
        ],
      });
    }

    // Recommendation 5: Constructor optimization
    if (estimate.breakdown.constructorData > 1000) {
      recommendations.push({
        type: 'constructor_optimization',
        severity: 'low',
        title: 'Constructor Optimization Opportunity',
        description: `Constructor arguments use ${estimate.breakdown.constructorData.toLocaleString()} gas. Consider optimizing initialization logic.`,
        potentialSavings: 'Save 5-15% by optimizing constructor',
        actionItems: [
          'Use immutable variables instead of storage',
          'Minimize constructor logic',
          'Use events instead of storage for historical data',
          'Batch multiple initialization steps',
        ],
      });
    }

    // Recommendation 6: General gas optimization
    if (estimate.deploymentGas > 1000000) {
      recommendations.push({
        type: 'gas_optimization',
        severity: 'medium',
        title: 'General Gas Optimization',
        description: `Deployment requires ${estimate.deploymentGas.toLocaleString()} gas. General optimizations can reduce this significantly.`,
        actionItems: [
          'Use events instead of storage where possible',
          'Pack struct variables efficiently',
          'Use bytes32 instead of string when possible',
          'Minimize SLOAD operations',
          'Use unchecked blocks for safe math',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Calculate optimization score (0-100)
   * @param estimate Gas estimate
   * @param simulation Optional simulation result
   * @returns Score from 0-100, higher is better
   */
  private calculateOptimizationScore(
    estimate: GasEstimateWithPrice,
    simulation:
      | { result: SimulationResult; comparison: GasComparison }
      | undefined
  ): number {
    let score = 100;

    // Penalty for large bytecode (max -30 points)
    const sizeRatio = estimate.bytecodeSize / 24576; // Ratio to max contract size
    const sizePenalty = Math.min(30, sizeRatio * 40);
    score -= sizePenalty;

    // Penalty for high gas usage (max -25 points)
    const gasRatio = estimate.deploymentGas / 5000000; // Ratio to very high gas
    const gasPenalty = Math.min(25, gasRatio * 30);
    score -= gasPenalty;

    // Penalty for high cost (max -20 points)
    const costUSD = parseFloat(estimate.costInUSD || '0');
    const costPenalty = Math.min(20, (costUSD / 100) * 20);
    score -= costPenalty;

    // Bonus for accurate estimation if simulation available (max +10 points)
    if (simulation) {
      const accuracyBonus = (simulation.comparison.accuracyPercent / 100) * 10;
      score += accuracyBonus;
    }

    // Bonus for small, efficient contracts (max +15 points)
    if (estimate.bytecodeSize < 5000) {
      score += 15;
    } else if (estimate.bytecodeSize < 10000) {
      score += 7;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Format optimization report for display
   * @param report Optimization report
   * @param format Output format (cli, ci, json)
   * @returns Formatted report string
   */
  formatReport(report: OptimizationReport, format: ReportFormat): string {
    if (format === 'json') {
      // Custom replacer to handle BigInt serialization
      return JSON.stringify(
        report,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
    }

    const isCi = format === 'ci';
    const h1 = isCi ? '## ' : '';
    const h2 = isCi ? '### ' : '';
    const h3 = isCi ? '#### ' : '';
    const bold = (text: string) => (isCi ? `**${text}**` : text);

    let output = '';

    // Header
    output += `${h1}Gas Optimization Report\n\n`;
    output += `${bold('Network:')} ${report.primaryNetwork}\n`;
    output += `${bold('Optimization Score:')} ${report.optimizationScore}/100\n`;
    output += `${bold('Timestamp:')} ${new Date(report.timestamp).toISOString()}\n\n`;

    // Gas Estimate
    output += `${h2}Gas Estimate\n`;
    output += `${bold('Bytecode Size:')} ${report.estimate.bytecodeSize.toLocaleString()} bytes\n`;
    output += `${bold('Estimated Gas:')} ${report.estimate.deploymentGas.toLocaleString()}\n`;
    output += `${bold('Estimated Cost:')} $${report.estimate.costInUSD || 'N/A'} (${report.estimate.costInEther || 'N/A'} ETH)\n`;
    output += `${bold('Gas Price:')} ${Number(report.estimate.gasPrice.standard)} gwei\n\n`;

    // Gas Breakdown
    output += `${h3}Gas Breakdown\n`;
    output += `- Base Cost: ${report.estimate.breakdown.baseCost.toLocaleString()} gas\n`;
    output += `- Contract Creation: ${report.estimate.breakdown.creationCost.toLocaleString()} gas\n`;
    output += `- Code Storage: ${report.estimate.breakdown.codeStorage.toLocaleString()} gas\n`;
    output += `- Constructor Data: ${report.estimate.breakdown.constructorData.toLocaleString()} gas\n\n`;

    // Simulation results
    if (report.simulation) {
      output += `${h2}Simulation Results\n`;
      output += `${bold('Actual Gas Used:')} ${report.simulation.result.actualGasUsed.toLocaleString()}\n`;
      output += `${bold('Deployment Address:')} ${report.simulation.result.deploymentAddress || 'N/A'}\n`;
      output += `${bold('Estimation Accuracy:')} ${report.simulation.comparison.accuracyPercent.toFixed(2)}%\n`;
      output += `${bold('Within Tolerance:')} ${report.simulation.comparison.withinTolerance ? '✓ Yes' : '✗ No'}\n`;
      output += `${bold('Difference:')} ${report.simulation.comparison.difference > 0 ? '+' : ''}${report.simulation.comparison.difference.toLocaleString()} gas\n\n`;
    }

    // Network Comparison
    if (report.networkComparison) {
      output += `${h2}Network Comparison\n`;
      output += `${bold('Cheapest:')} ${report.networkComparison.cheapest.network} ($${report.networkComparison.cheapest.estimatedCost})\n`;
      output += `${bold('Most Expensive:')} ${report.networkComparison.mostExpensive.network} ($${report.networkComparison.mostExpensive.estimatedCost})\n`;
      output += `${bold('Potential Savings:')} $${report.networkComparison.savings.toFixed(2)}\n\n`;

      output += `${h3}All Networks\n`;
      for (const network of report.networkComparison.networks) {
        output += `- ${network.network}: ${network.estimatedGas.toLocaleString()} gas ($${network.estimatedCost})\n`;
      }
      output += '\n';
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      output += `${h2}Recommendations\n`;
      for (const rec of report.recommendations) {
        const severityIcon =
          rec.severity === 'high'
            ? '🔴'
            : rec.severity === 'medium'
              ? '🟡'
              : rec.severity === 'low'
                ? '🔵'
                : 'ℹ️';

        output += `\n${h3}${severityIcon} ${rec.title}\n`;
        output += `${rec.description}\n`;

        if (rec.potentialSavings) {
          output += `${bold('Potential Savings:')} ${rec.potentialSavings}\n`;
        }

        if (rec.actionItems && rec.actionItems.length > 0) {
          output += `${bold('Action Items:')}\n`;
          for (const item of rec.actionItems) {
            output += `  - ${item}\n`;
          }
        }
      }
    }

    return output;
  }
}
