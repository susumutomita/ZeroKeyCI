import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptimizationReporter } from '../optimization-reporter';
import type { GasPriceFetcher } from '../gas-price-fetcher';
import type { GasEstimator } from '../gas-estimator';
import type { DeploymentSimulator } from '../deployment-simulator';
import type { SupportedNetwork } from '../network-config';

describe('OptimizationReporter', () => {
  let reporter: OptimizationReporter;
  let mockGasPriceFetcher: GasPriceFetcher;
  let mockGasEstimator: GasEstimator;
  let mockDeploymentSimulator: DeploymentSimulator;

  beforeEach(() => {
    // Mock GasPriceFetcher
    mockGasPriceFetcher = {
      fetchGasPrice: vi.fn().mockResolvedValue({
        network: 'sepolia',
        slow: 10,
        standard: 20,
        fast: 30,
        timestamp: Date.now(),
      }),
      fetchMultipleNetworks: vi.fn().mockResolvedValue([
        {
          network: 'sepolia',
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
        {
          network: 'mainnet',
          slow: 25,
          standard: 50,
          fast: 70,
          timestamp: Date.now(),
        },
      ]),
    } as any;

    // Mock GasEstimator
    mockGasEstimator = {
      estimateDeployment: vi.fn().mockReturnValue({
        network: 'sepolia',
        bytecodeSize: 1000,
        deploymentGas: 250000,
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 200000,
          constructorData: 0,
        },
      }),
      estimateWithPrice: vi.fn().mockReturnValue({
        network: 'sepolia',
        bytecodeSize: 1000,
        deploymentGas: 250000,
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 200000,
          constructorData: 0,
        },
        gasPrice: {
          network: 'sepolia',
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
        tier: 'standard',
        costInWei: '5000000000000000',
        costInEther: '0.005',
        costInUSD: '12.50',
      }),
      compareNetworks: vi.fn().mockReturnValue({
        bytecode: '0x1234',
        estimates: [
          {
            network: 'sepolia',
            bytecodeSize: 1000,
            deploymentGas: 250000,
            breakdown: {
              baseCost: 21000,
              creationCost: 32000,
              codeStorage: 200000,
              constructorData: 0,
            },
            gasPrice: {
              network: 'sepolia',
              slow: 10,
              standard: 20,
              fast: 30,
              timestamp: Date.now(),
            },
            tier: 'standard',
            costInWei: '5000000000000000',
            costInEther: '0.005',
            costInUSD: '12.50',
          },
          {
            network: 'mainnet',
            bytecodeSize: 1000,
            deploymentGas: 250000,
            breakdown: {
              baseCost: 21000,
              creationCost: 32000,
              codeStorage: 200000,
              constructorData: 0,
            },
            gasPrice: {
              network: 'mainnet',
              slow: 25,
              standard: 50,
              fast: 70,
              timestamp: Date.now(),
            },
            tier: 'standard',
            costInWei: '12500000000000000',
            costInEther: '0.0125',
            costInUSD: '31.25',
          },
        ],
        cheapest: {
          network: 'sepolia',
          bytecodeSize: 1000,
          deploymentGas: 250000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 200000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '5000000000000000',
          costInEther: '0.005',
          costInUSD: '12.50',
        },
        mostExpensive: {
          network: 'mainnet',
          bytecodeSize: 1000,
          deploymentGas: 250000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 200000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'mainnet',
            slow: 25,
            standard: 50,
            fast: 70,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '12500000000000000',
          costInEther: '0.0125',
          costInUSD: '31.25',
        },
      }),
    } as any;

    // Mock DeploymentSimulator
    mockDeploymentSimulator = {
      simulateDeployment: vi.fn().mockResolvedValue({
        network: 'sepolia',
        success: true,
        actualGasUsed: 245000,
        deploymentAddress: '0x1234567890123456789012345678901234567890',
        gasBreakdown: {
          baseCost: 21000,
          deploymentCost: 224000,
        },
        timestamp: Date.now(),
      }),
      compareWithEstimate: vi.fn().mockReturnValue({
        estimatedGas: 250000,
        actualGas: 245000,
        difference: -5000,
        accuracyPercent: 97.96,
        withinTolerance: true,
      }),
    } as any;

    reporter = new OptimizationReporter(
      mockGasPriceFetcher,
      mockGasEstimator,
      mockDeploymentSimulator
    );
  });

  describe('generateReport', () => {
    it('should generate comprehensive optimization report', async () => {
      // Mock expensive deployment to trigger recommendations
      (mockGasEstimator.estimateWithPrice as any).mockReturnValueOnce({
        network: 'sepolia',
        bytecodeSize: 15000, // Large enough to trigger some recommendations
        deploymentGas: 3000000, // High gas to trigger gas_optimization recommendation
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 3000000,
          constructorData: 0,
        },
        gasPrice: {
          network: 'sepolia',
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
        tier: 'standard',
        costInWei: '60000000000000000',
        costInEther: '0.06',
        costInUSD: '150.00', // Expensive enough to trigger high_cost recommendation
      });

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
        includeSimulation: true,
        compareNetworks: ['sepolia', 'mainnet'],
      });

      expect(report).toBeDefined();
      expect(report.bytecode).toBe(bytecode);
      expect(report.primaryNetwork).toBe('sepolia');
      expect(report.estimate).toBeDefined();
      expect(report.simulation).toBeDefined();
      expect(report.networkComparison).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.timestamp).toBeGreaterThan(0);
    });

    it('should handle report without simulation', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
        includeSimulation: false,
      });

      expect(report.simulation).toBeUndefined();
      expect(report.estimate).toBeDefined();
    });

    it('should handle report without network comparison', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      expect(report.networkComparison).toBeUndefined();
      expect(report.estimate).toBeDefined();
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for large bytecode', async () => {
      // Create new reporter with large bytecode mock
      const largeMockEstimator = {
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 21000, // Large contract (>20000 threshold)
          deploymentGas: 5250000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 5000000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '105000000000000000',
          costInEther: '0.105',
          costInUSD: '262.50',
        }),
      } as any;

      const largeReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        largeMockEstimator,
        mockDeploymentSimulator
      );

      const bytecode = '0x' + '60'.repeat(21000);

      const report = await largeReporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      const sizeRecommendation = report.recommendations.find(
        (r) => r.type === 'bytecode_size'
      );
      expect(sizeRecommendation).toBeDefined();
      expect(sizeRecommendation?.severity).toBe('high');
    });

    it('should generate recommendations for expensive deployment', async () => {
      // Mock expensive deployment
      (mockGasEstimator.estimateWithPrice as any).mockReturnValue({
        network: 'mainnet',
        bytecodeSize: 1000,
        deploymentGas: 250000,
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 200000,
          constructorData: 0,
        },
        gasPrice: {
          network: 'mainnet',
          slow: 50,
          standard: 100,
          fast: 150,
          timestamp: Date.now(),
        },
        tier: 'standard',
        costInWei: '25000000000000000',
        costInEther: '0.025',
        costInUSD: '62.50',
      });

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'mainnet',
      });

      const costRecommendation = report.recommendations.find(
        (r) => r.type === 'high_cost'
      );
      expect(costRecommendation).toBeDefined();
      expect(costRecommendation?.severity).toMatch(/medium|high/);
    });

    it('should recommend cheaper network when available', async () => {
      // Setup mocks to ensure significant cost difference
      (mockGasPriceFetcher.fetchGasPrice as any).mockImplementation(
        (network: SupportedNetwork) => {
          if (network === 'mainnet') {
            return Promise.resolve({
              network: 'mainnet',
              slow: 25,
              standard: 50,
              fast: 70,
              timestamp: Date.now(),
            });
          }
          return Promise.resolve({
            network,
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          });
        }
      );

      (mockGasEstimator.estimateWithPrice as any).mockImplementation(
        (bytecode: string, gasPrice: any, options: any) => {
          const baseGas = 250000;
          const isMainnet = gasPrice.network === 'mainnet';
          const costMultiplier = isMainnet ? 50n : 20n;

          return {
            network: gasPrice.network,
            bytecodeSize: 1000,
            deploymentGas: baseGas,
            breakdown: {
              baseCost: 21000,
              creationCost: 32000,
              codeStorage: 200000,
              constructorData: 0,
            },
            gasPrice,
            tier: options.tier,
            costInWei: String(BigInt(baseGas) * costMultiplier),
            costInEther: String(
              Number(BigInt(baseGas) * costMultiplier) / 1e18
            ),
            costInUSD: isMainnet ? '31.25' : '12.50', // >$5 difference to trigger recommendation
          };
        }
      );

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'mainnet',
        compareNetworks: ['sepolia', 'mainnet', 'polygon'],
      });

      const networkRecommendation = report.recommendations.find(
        (r) => r.type === 'cheaper_network'
      );
      expect(networkRecommendation).toBeDefined();
    });

    it('should recommend timing optimization for high gas prices', async () => {
      // Create new reporter with high gas price mock
      const highGasPriceFetcher = {
        fetchGasPrice: vi.fn().mockResolvedValue({
          network: 'mainnet',
          slow: 100,
          standard: 200, // >100 gwei threshold
          fast: 300,
          timestamp: Date.now(),
        }),
      } as any;

      const highGasEstimator = {
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'mainnet',
          bytecodeSize: 1000,
          deploymentGas: 250000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 200000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'mainnet',
            slow: 100,
            standard: 200,
            fast: 300,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '50000000000000000',
          costInEther: '0.05',
          costInUSD: '125.00',
        }),
      } as any;

      const highGasReporter = new OptimizationReporter(
        highGasPriceFetcher,
        highGasEstimator,
        mockDeploymentSimulator
      );

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await highGasReporter.generateReport(bytecode, {
        network: 'mainnet',
      });

      const timingRecommendation = report.recommendations.find(
        (r) => r.type === 'timing'
      );
      expect(timingRecommendation).toBeDefined();
    });

    it('should recommend constructor optimization for high constructor gas', async () => {
      // Create new reporter with high constructor data mock
      const highConstructorEstimator = {
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 1000,
          deploymentGas: 250000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 200000,
            constructorData: 5000, // >1000 threshold
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '5000000000000000',
          costInEther: '0.005',
          costInUSD: '12.50',
        }),
      } as any;

      const highConstructorReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        highConstructorEstimator,
        mockDeploymentSimulator
      );

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await highConstructorReporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      const constructorRecommendation = report.recommendations.find(
        (r) => r.type === 'constructor_optimization'
      );
      expect(constructorRecommendation).toBeDefined();
      expect(constructorRecommendation?.severity).toBe('low');
    });

    it('should generate medium severity recommendation for moderate cost', async () => {
      // Create new reporter with moderate cost mock ($20-$50 range)
      const moderateCostEstimator = {
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 1000,
          deploymentGas: 250000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 200000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '10000000000000000',
          costInEther: '0.01',
          costInUSD: '25.00', // Between $20-$50
        }),
      } as any;

      const moderateCostReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        moderateCostEstimator,
        mockDeploymentSimulator
      );

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await moderateCostReporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      const costRecommendation = report.recommendations.find(
        (r) => r.type === 'high_cost'
      );
      expect(costRecommendation).toBeDefined();
      expect(costRecommendation?.severity).toBe('medium');
      expect(costRecommendation?.title).toBe('Moderate Deployment Cost');
    });
  });

  describe('formatReport', () => {
    it('should format report for CLI display', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
        includeSimulation: true,
      });

      const formatted = reporter.formatReport(report, 'cli');

      expect(formatted).toContain('Gas Optimization Report');
      expect(formatted).toContain('Network:');
      expect(formatted).toContain('Estimated Gas:');
      // Recommendations section only appears if there are recommendations
      if (report.recommendations.length > 0) {
        expect(formatted).toContain('Recommendations');
      }
    });

    it('should format report for CI/CD display', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
        includeSimulation: true,
      });

      const formatted = reporter.formatReport(report, 'ci');

      expect(formatted).toContain('## Gas Optimization Report');
      expect(formatted).toContain('**Network:**');
      expect(formatted).toContain('**Estimated Gas:**');
      // Recommendations section only appears if there are recommendations
      if (report.recommendations.length > 0) {
        expect(formatted).toContain('### Recommendations');
      }
    });

    it('should format report with network comparison', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
        compareNetworks: ['sepolia', 'mainnet'],
      });

      const formatted = reporter.formatReport(report, 'cli');

      expect(formatted).toContain('Network Comparison');
      expect(formatted).toContain('sepolia');
      expect(formatted).toContain('mainnet');
    });

    it('should format report with simulation results', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
        includeSimulation: true,
      });

      const formatted = reporter.formatReport(report, 'cli');

      expect(formatted).toContain('Simulation');
      expect(formatted).toContain('Actual Gas');
      expect(formatted).toContain('Accuracy');
    });

    it('should format report as JSON', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      const formatted = reporter.formatReport(report, 'json');
      const parsed = JSON.parse(formatted);

      expect(parsed).toBeDefined();
      expect(parsed.bytecode).toBe(bytecode);
      expect(parsed.primaryNetwork).toBe('sepolia');
      expect(parsed.estimate).toBeDefined();
    });

    it('should format recommendations with all severity levels', async () => {
      // Create a mock with multiple recommendation types
      const multiRecMockEstimator = {
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'mainnet',
          bytecodeSize: 21000, // High severity: large bytecode
          deploymentGas: 5200000, // Medium/High severity: high gas
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 5000000,
            constructorData: 2000, // Low severity: constructor optimization
          },
          gasPrice: {
            network: 'mainnet',
            slow: 75,
            standard: 150, // High gas price
            fast: 200,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '780000000000000000',
          costInEther: '0.78',
          costInUSD: '1950.00', // Very expensive
        }),
      } as any;

      const multiRecReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        multiRecMockEstimator,
        mockDeploymentSimulator
      );

      const bytecode = '0x' + '60'.repeat(21000);

      const report = await multiRecReporter.generateReport(bytecode, {
        network: 'mainnet',
      });

      const formatted = multiRecReporter.formatReport(report, 'cli');

      // Should contain recommendations with different severity icons
      expect(formatted).toContain('Recommendations');
      // Check for at least one recommendation being formatted
      expect(report.recommendations.length).toBeGreaterThan(0);

      // Verify recommendations contain action items and potential savings
      const hasActionItems = report.recommendations.some(
        (r) => r.actionItems && r.actionItems.length > 0
      );
      const hasPotentialSavings = report.recommendations.some(
        (r) => r.potentialSavings !== undefined
      );

      expect(hasActionItems).toBe(true);
      expect(hasPotentialSavings).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle network comparison with equal costs', async () => {
      // Setup mocks where all networks have same cost
      (mockGasPriceFetcher.fetchGasPrice as any).mockImplementation(
        (_network: SupportedNetwork) => {
          return Promise.resolve({
            network: _network,
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          });
        }
      );

      (mockGasEstimator.estimateWithPrice as any).mockImplementation(
        (bytecode: string, gasPrice: any, options: any) => {
          return {
            network: gasPrice.network,
            bytecodeSize: 1000,
            deploymentGas: 250000,
            breakdown: {
              baseCost: 21000,
              creationCost: 32000,
              codeStorage: 200000,
              constructorData: 0,
            },
            gasPrice,
            tier: options.tier,
            costInWei: '5000000000000000',
            costInEther: '0.005',
            costInUSD: '12.50', // Same cost for all networks
          };
        }
      );

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const comparison = await reporter.compareNetworks(bytecode, [
        'sepolia',
        'mainnet',
      ]);

      // When costs are equal, savings should be 0
      expect(comparison.savings).toBe(0);
    });

    it('should handle recommendations without potentialSavings or actionItems', async () => {
      // This tests edge cases in formatReport
      const report = await reporter.generateReport(
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe',
        {
          network: 'sepolia',
        }
      );

      // Format the report to exercise all formatting branches
      const cliOutput = reporter.formatReport(report, 'cli');
      const ciOutput = reporter.formatReport(report, 'ci');
      const jsonOutput = reporter.formatReport(report, 'json');

      expect(cliOutput).toContain('Gas Optimization Report');
      expect(ciOutput).toContain('sepolia'); // CI format includes network name
      expect(JSON.parse(jsonOutput)).toHaveProperty('bytecode');
    });
  });

  describe('compareNetworks', () => {
    it('should compare deployment costs across networks', async () => {
      // Setup mock for polygon network
      (mockGasPriceFetcher.fetchGasPrice as any).mockImplementation(
        (network: SupportedNetwork) => {
          if (network === 'polygon') {
            return Promise.resolve({
              network: 'polygon',
              slow: 50,
              standard: 100,
              fast: 150,
              timestamp: Date.now(),
            });
          }
          return Promise.resolve({
            network,
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          });
        }
      );

      (mockGasEstimator.estimateWithPrice as any).mockImplementation(
        (bytecode: string, gasPrice: any, options: any) => {
          const costMultiplier =
            gasPrice.network === 'polygon'
              ? 100n
              : gasPrice.network === 'mainnet'
                ? 50n
                : 20n;
          return {
            network: gasPrice.network,
            bytecodeSize: 1000,
            deploymentGas: 250000,
            breakdown: {
              baseCost: 21000,
              creationCost: 32000,
              codeStorage: 200000,
              constructorData: 0,
            },
            gasPrice,
            tier: options.tier,
            costInWei: String(250000n * costMultiplier),
            costInEther: String(Number(250000n * costMultiplier) / 1e18),
            costInUSD: String((Number(250000n * costMultiplier) / 1e18) * 2500),
          };
        }
      );

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const comparison = await reporter.compareNetworks(bytecode, [
        'sepolia',
        'mainnet',
        'polygon',
      ]);

      expect(comparison).toBeDefined();
      expect(comparison.networks).toHaveLength(3);
      expect(comparison.cheapest).toBeDefined();
      expect(comparison.mostExpensive).toBeDefined();
      expect(comparison.savings).toBeDefined();
      expect(comparison.savings).toBeGreaterThan(0);
    });

    it('should handle single network comparison', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const comparison = await reporter.compareNetworks(bytecode, ['sepolia']);

      expect(comparison.networks).toHaveLength(1);
      expect(comparison.cheapest.network).toBe('sepolia');
      expect(comparison.mostExpensive.network).toBe('sepolia');
      expect(comparison.savings).toBe(0);
    });
  });

  describe('getOptimizationScore', () => {
    it('should calculate optimization score based on cost and size', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const report = await reporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      expect(report.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(report.optimizationScore).toBeLessThanOrEqual(100);
    });

    it('should give lower score for large contracts', async () => {
      // Create new reporter with mocked estimator for large contract
      const largeMockEstimator = {
        estimateDeployment: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 24000,
          deploymentGas: 5200000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 5000000,
            constructorData: 0,
          },
        }),
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 24000,
          deploymentGas: 5200000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 5000000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '104000000000000000',
          costInEther: '0.104',
          costInUSD: '260.00',
        }),
      } as any;

      const largeReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        largeMockEstimator,
        mockDeploymentSimulator
      );

      const bytecode = '0x' + '60'.repeat(24000);

      const report = await largeReporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      expect(report.optimizationScore).toBeLessThan(70);
    });

    it('should give higher score for optimized contracts', async () => {
      // Create new reporter with mocked estimator for small contract
      const smallMockEstimator = {
        estimateDeployment: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 500,
          deploymentGas: 125000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 100000,
            constructorData: 0,
          },
        }),
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 500,
          deploymentGas: 125000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 100000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '2500000000000000',
          costInEther: '0.0025',
          costInUSD: '6.25',
        }),
      } as any;

      const smallReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        smallMockEstimator,
        mockDeploymentSimulator
      );

      const bytecode = '0x' + '60'.repeat(500);

      const report = await smallReporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      expect(report.optimizationScore).toBeGreaterThan(80);
    });

    it('should give medium-high score for medium-sized contracts', async () => {
      // Create reporter with medium-sized contract (5000-9999 bytes)
      const mediumMockEstimator = {
        estimateWithPrice: vi.fn().mockReturnValue({
          network: 'sepolia',
          bytecodeSize: 7500, // Between 5000 and 10000
          deploymentGas: 1500000,
          breakdown: {
            baseCost: 21000,
            creationCost: 32000,
            codeStorage: 1500000,
            constructorData: 0,
          },
          gasPrice: {
            network: 'sepolia',
            slow: 10,
            standard: 20,
            fast: 30,
            timestamp: Date.now(),
          },
          tier: 'standard',
          costInWei: '30000000000000000',
          costInEther: '0.03',
          costInUSD: '75.00',
        }),
      } as any;

      const mediumReporter = new OptimizationReporter(
        mockGasPriceFetcher,
        mediumMockEstimator,
        mockDeploymentSimulator
      );

      const bytecode = '0x' + '60'.repeat(7500);

      const report = await mediumReporter.generateReport(bytecode, {
        network: 'sepolia',
      });

      // Should get +7 bonus for bytecode < 10000
      expect(report.optimizationScore).toBeGreaterThan(70);
      expect(report.optimizationScore).toBeLessThan(100);
    });
  });
});
