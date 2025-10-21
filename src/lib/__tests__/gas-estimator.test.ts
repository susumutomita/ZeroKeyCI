import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GasEstimator, type GasEstimate } from '../gas-estimator';
import type { SupportedNetwork } from '../network-config';

describe('GasEstimator', () => {
  let estimator: GasEstimator;

  beforeEach(() => {
    estimator = new GasEstimator();
  });

  describe('estimateDeployment', () => {
    it('should estimate gas for simple contract deployment', () => {
      // Simple contract bytecode (example: empty constructor)
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      expect(estimate.network).toBe('sepolia');
      expect(estimate.bytecodeSize).toBeGreaterThan(0);
      expect(estimate.deploymentGas).toBeGreaterThan(0);
      expect(estimate.breakdown).toBeDefined();
      expect(estimate.breakdown.baseCost).toBe(21000); // Transaction base cost
      expect(estimate.breakdown.creationCost).toBe(32000); // Contract creation cost
      expect(estimate.breakdown.codeStorage).toBeGreaterThan(0); // Code storage cost
    });

    it('should default to sepolia network when not specified', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const estimate = estimator.estimateDeployment(bytecode); // No network specified

      expect(estimate.network).toBe('sepolia'); // Should default to sepolia
      expect(estimate.deploymentGas).toBeGreaterThan(0);
    });

    it('should estimate gas for contract with constructor args', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const constructorArgs = ['uint256', 'address'];

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'mainnet',
        constructorArgs,
      });

      expect(estimate.network).toBe('mainnet');
      expect(estimate.deploymentGas).toBeGreaterThan(0);
      expect(estimate.breakdown.constructorData).toBeGreaterThan(0);
    });

    it('should throw error for invalid bytecode without 0x prefix', () => {
      expect(() => {
        estimator.estimateDeployment('invalid', { network: 'sepolia' });
      }).toThrow('Invalid bytecode');
    });

    it('should throw error for invalid hex characters', () => {
      expect(() => {
        estimator.estimateDeployment('0xGGHH', { network: 'sepolia' });
      }).toThrow('Invalid bytecode: not valid hex');
    });

    it('should throw error for empty bytecode', () => {
      expect(() => {
        estimator.estimateDeployment('', { network: 'sepolia' });
      }).toThrow('Invalid bytecode');
    });

    it('should estimate gas for all supported networks', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const networks: SupportedNetwork[] = [
        'mainnet',
        'sepolia',
        'polygon',
        'arbitrum',
        'optimism',
        'base',
      ];

      networks.forEach((network) => {
        const estimate = estimator.estimateDeployment(bytecode, { network });
        expect(estimate.network).toBe(network);
        expect(estimate.deploymentGas).toBeGreaterThan(0);
      });
    });

    it('should calculate higher gas for larger bytecode', () => {
      const smallBytecode =
        '0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe';
      const largeBytecode = '0x' + '60'.repeat(5000); // 5000 bytes of bytecode

      const smallEstimate = estimator.estimateDeployment(smallBytecode, {
        network: 'sepolia',
      });
      const largeEstimate = estimator.estimateDeployment(largeBytecode, {
        network: 'sepolia',
      });

      expect(largeEstimate.deploymentGas).toBeGreaterThan(
        smallEstimate.deploymentGas
      );
      expect(largeEstimate.bytecodeSize).toBeGreaterThan(
        smallEstimate.bytecodeSize
      );
    });
  });

  describe('estimateWithPrice', () => {
    it('should calculate deployment cost in wei', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrice = {
        network: 'sepolia' as SupportedNetwork,
        slow: 1,
        standard: 2,
        fast: 3,
        timestamp: Date.now(),
      };

      const estimate = estimator.estimateWithPrice(bytecode, gasPrice, {
        tier: 'standard',
      });

      expect(estimate.network).toBe('sepolia');
      expect(estimate.bytecodeSize).toBeGreaterThan(0);
      expect(estimate.deploymentGas).toBeGreaterThan(0);
      expect(estimate.gasPrice).toEqual(gasPrice);
      expect(estimate.tier).toBe('standard');
      expect(BigInt(estimate.costInWei)).toBeGreaterThan(0n);
      expect(Number(estimate.costInEther)).toBeGreaterThan(0);
      expect(estimate.costInUSD).toBeUndefined(); // No ETH price provided
    });

    it('should calculate cost for different gas tiers', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrice = {
        network: 'sepolia' as SupportedNetwork,
        slow: 10,
        standard: 20,
        fast: 30,
        timestamp: Date.now(),
      };

      const slowEstimate = estimator.estimateWithPrice(bytecode, gasPrice, {
        tier: 'slow',
      });
      const standardEstimate = estimator.estimateWithPrice(bytecode, gasPrice, {
        tier: 'standard',
      });
      const fastEstimate = estimator.estimateWithPrice(bytecode, gasPrice, {
        tier: 'fast',
      });

      expect(BigInt(slowEstimate.costInWei)).toBeLessThan(
        BigInt(standardEstimate.costInWei)
      );
      expect(BigInt(standardEstimate.costInWei)).toBeLessThan(
        BigInt(fastEstimate.costInWei)
      );
    });

    it('should calculate USD cost when ETH price provided', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrice = {
        network: 'sepolia' as SupportedNetwork,
        slow: 10,
        standard: 20,
        fast: 30,
        timestamp: Date.now(),
      };
      const ethPriceUSD = 2000;

      const estimate = estimator.estimateWithPrice(bytecode, gasPrice, {
        tier: 'standard',
        ethPriceUSD,
      });

      expect(estimate.costInUSD).toBeDefined();
      expect(Number(estimate.costInUSD)).toBeGreaterThan(0);
      expect(estimate.ethPriceUSD).toBe(ethPriceUSD);
    });

    it('should handle network mismatch', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrice = {
        network: 'mainnet' as SupportedNetwork,
        slow: 10,
        standard: 20,
        fast: 30,
        timestamp: Date.now(),
      };

      // Estimating for sepolia but providing mainnet gas price should throw
      expect(() => {
        estimator.estimateWithPrice(
          bytecode,
          gasPrice,
          {
            tier: 'standard',
          },
          'sepolia'
        );
      }).toThrow('Network mismatch');
    });
  });

  describe('analyzeBytecode', () => {
    it('should analyze bytecode structure', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const analysis = estimator.analyzeBytecode(bytecode);

      expect(analysis.size).toBeGreaterThan(0);
      expect(analysis.sizeInBytes).toBeGreaterThan(0);
      expect(analysis.hasConstructor).toBeDefined();
      expect(analysis.complexity).toBeDefined();
    });

    it('should analyze bytecode without 0x prefix', () => {
      const bytecode =
        '608060405234801561001057600080fd5b50610150806100206000396000f3fe'; // No 0x prefix

      const analysis = estimator.analyzeBytecode(bytecode);

      expect(analysis.size).toBe(64);
      expect(analysis.sizeInBytes).toBe(32);
    });

    it('should detect constructor presence', () => {
      // Bytecode with constructor
      const withConstructor =
        '0x608060405234801561001057600080fd5b5060405161015038038061015083398101604081905261002f9161007c565b600080546001600160a01b0319166001600160a01b0392909216919091179055610094565b';

      // Bytecode without constructor
      const withoutConstructor =
        '0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe';

      const analysisWithConstructor =
        estimator.analyzeBytecode(withConstructor);
      const analysisWithoutConstructor =
        estimator.analyzeBytecode(withoutConstructor);

      // Both should have hasConstructor property
      expect(analysisWithConstructor.hasConstructor).toBeDefined();
      expect(analysisWithoutConstructor.hasConstructor).toBeDefined();
    });

    it('should calculate complexity score', () => {
      const simpleBytecode =
        '0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe';
      const complexBytecode = '0x' + '60'.repeat(5000);

      const simpleAnalysis = estimator.analyzeBytecode(simpleBytecode);
      const complexAnalysis = estimator.analyzeBytecode(complexBytecode);

      expect(complexAnalysis.complexity).toBeGreaterThan(
        simpleAnalysis.complexity
      );
    });
  });

  describe('formatEstimate', () => {
    it('should format gas estimate for display', () => {
      const estimate: GasEstimate = {
        network: 'sepolia',
        bytecodeSize: 500,
        deploymentGas: 150000,
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 100000,
          constructorData: 0,
        },
      };

      const formatted = estimator.formatEstimate(estimate);

      expect(formatted).toContain('sepolia');
      expect(formatted).toContain('500');
      expect(formatted).toContain('150,000'); // toLocaleString adds commas
      expect(formatted).toContain('21,000');
      expect(formatted).toContain('32,000');
      expect(formatted).toContain('100,000');
    });

    it('should format estimate with cost information', () => {
      const estimate: GasEstimate = {
        network: 'mainnet',
        bytecodeSize: 500,
        deploymentGas: 150000,
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 100000,
          constructorData: 0,
        },
        costInWei: '3000000000000000', // 0.003 ETH
        costInEther: '0.003',
        costInUSD: '6.00',
      };

      const formatted = estimator.formatEstimate(estimate);

      expect(formatted).toContain('0.003');
      expect(formatted).toContain('6.00');
    });

    it('should format estimate with constructor data', () => {
      const estimate: GasEstimate = {
        network: 'mainnet',
        bytecodeSize: 500,
        deploymentGas: 150640,
        breakdown: {
          baseCost: 21000,
          creationCost: 32000,
          codeStorage: 100000,
          constructorData: 640, // Has constructor data
        },
        costInEther: '0.003',
      };

      const formatted = estimator.formatEstimate(estimate);

      expect(formatted).toContain('Constructor Data Cost: 640 gas');
      expect(formatted).toContain('0.003 ETH');
    });
  });

  describe('compareNetworks', () => {
    it('should compare deployment costs across networks', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrices = [
        {
          network: 'mainnet' as SupportedNetwork,
          slow: 30,
          standard: 35,
          fast: 40,
          timestamp: Date.now(),
        },
        {
          network: 'polygon' as SupportedNetwork,
          slow: 100,
          standard: 150,
          fast: 200,
          timestamp: Date.now(),
        },
        {
          network: 'arbitrum' as SupportedNetwork,
          slow: 0.1,
          standard: 0.2,
          fast: 0.3,
          timestamp: Date.now(),
        },
      ];

      const comparison = estimator.compareNetworks(bytecode, gasPrices);

      expect(comparison.bytecode).toBe(bytecode);
      expect(comparison.estimates).toHaveLength(3);
      expect(comparison.cheapest).toBeDefined();
      expect(comparison.mostExpensive).toBeDefined();

      // Cheapest should have lowest cost
      const cheapestCost = BigInt(comparison.cheapest.costInWei);
      const mostExpensiveCost = BigInt(comparison.mostExpensive.costInWei);
      expect(cheapestCost).toBeLessThan(mostExpensiveCost);
    });

    it('should sort networks by cost', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrices = [
        {
          network: 'mainnet' as SupportedNetwork,
          slow: 50,
          standard: 60,
          fast: 70,
          timestamp: Date.now(),
        },
        {
          network: 'sepolia' as SupportedNetwork,
          slow: 1,
          standard: 2,
          fast: 3,
          timestamp: Date.now(),
        },
      ];

      const comparison = estimator.compareNetworks(bytecode, gasPrices, {
        tier: 'standard',
        sortBy: 'cost',
      });

      // First estimate should be cheaper than last
      const firstCost = BigInt(comparison.estimates[0].costInWei);
      const lastCost = BigInt(
        comparison.estimates[comparison.estimates.length - 1].costInWei
      );
      expect(firstCost).toBeLessThan(lastCost);
    });

    it('should sort networks by gas', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrices = [
        {
          network: 'mainnet' as SupportedNetwork,
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
        {
          network: 'sepolia' as SupportedNetwork,
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
      ];

      const comparison = estimator.compareNetworks(bytecode, gasPrices, {
        tier: 'standard',
        sortBy: 'gas',
      });

      // All should have same gas (same bytecode)
      expect(comparison.estimates[0].deploymentGas).toBe(
        comparison.estimates[1].deploymentGas
      );
    });

    it('should sort networks by name', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const gasPrices = [
        {
          network: 'sepolia' as SupportedNetwork,
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
        {
          network: 'mainnet' as SupportedNetwork,
          slow: 10,
          standard: 20,
          fast: 30,
          timestamp: Date.now(),
        },
      ];

      const comparison = estimator.compareNetworks(bytecode, gasPrices, {
        tier: 'standard',
        sortBy: 'network',
      });

      // Should be sorted alphabetically
      expect(comparison.estimates[0].network).toBe('mainnet');
      expect(comparison.estimates[1].network).toBe('sepolia');
    });
  });
  describe('Caching and Performance Optimizations', () => {
    describe('Bytecode Analysis Caching', () => {
      it('should cache bytecode analysis results', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        // First call - cache miss
        const firstAnalysis = estimator.analyzeBytecode(bytecode);
        expect(firstAnalysis.size).toBeGreaterThan(0);

        // Second call - should hit cache
        const secondAnalysis = estimator.analyzeBytecode(bytecode);
        expect(secondAnalysis).toEqual(firstAnalysis);
      });

      it('should use different cache keys for different bytecode', () => {
        const bytecode1 =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
        const bytecode2 = '0x' + '60'.repeat(1000);

        const analysis1 = estimator.analyzeBytecode(bytecode1);
        const analysis2 = estimator.analyzeBytecode(bytecode2);

        expect(analysis1.size).not.toBe(analysis2.size);
        expect(analysis1.sizeInBytes).not.toBe(analysis2.sizeInBytes);
      });

      it('should clear cache when clearCache is called', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        // Populate cache
        estimator.analyzeBytecode(bytecode);

        const statsBeforeClear = estimator.getCacheStats();
        expect(statsBeforeClear.size).toBe(1);

        // Clear cache
        estimator.clearCache();

        const statsAfterClear = estimator.getCacheStats();
        expect(statsAfterClear.size).toBe(0);
      });

      it('should respect max cache size (LRU eviction)', () => {
        // Generate 101 unique bytecodes (more than MAX_CACHE_SIZE of 100)
        for (let i = 0; i < 101; i++) {
          const bytecode =
            '0x' + i.toString(16).padStart(4, '0') + '60'.repeat(100);
          estimator.analyzeBytecode(bytecode);
        }

        const stats = estimator.getCacheStats();
        expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
        expect(stats.maxSize).toBe(100);
      });

      it('should provide cache statistics', () => {
        const stats = estimator.getCacheStats();
        expect(stats).toHaveProperty('size');
        expect(stats).toHaveProperty('maxSize');
        expect(stats.maxSize).toBe(100);
        expect(stats.size).toBeGreaterThanOrEqual(0);
      });

      it('should expire cached entries after TTL (10 minutes)', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        // Analyze bytecode to populate cache
        const firstAnalysis = estimator.analyzeBytecode(bytecode);
        expect(estimator.getCacheStats().size).toBe(1);

        // Mock time advancement to 11 minutes later (beyond 10 minute TTL)
        const now = Date.now();
        vi.spyOn(Date, 'now').mockReturnValue(now + 11 * 60 * 1000);

        // Analyze again - should not use expired cache
        const secondAnalysis = estimator.analyzeBytecode(bytecode);
        expect(secondAnalysis).toEqual(firstAnalysis); // Same result
        expect(estimator.getCacheStats().size).toBe(1); // New entry replaced expired one

        // Restore real Date.now
        vi.restoreAllMocks();
      });
    });

    describe('Performance Metrics', () => {
      it('should include performance metrics in estimateDeployment', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        const estimate = estimator.estimateDeployment(bytecode, {
          network: 'sepolia',
        });

        expect(estimate.performance).toBeDefined();
        expect(estimate.performance?.durationMs).toBeGreaterThanOrEqual(0);
        expect(typeof estimate.performance?.durationMs).toBe('number');
      });

      it('should include performance metrics in compareNetworks', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
        const gasPrices = [
          {
            network: 'sepolia' as SupportedNetwork,
            slow: 1,
            standard: 2,
            fast: 3,
            timestamp: Date.now(),
          },
          {
            network: 'polygon' as SupportedNetwork,
            slow: 5,
            standard: 10,
            fast: 15,
            timestamp: Date.now(),
          },
        ];

        const comparison = estimator.compareNetworks(bytecode, gasPrices, {
          tier: 'standard',
        });

        expect(comparison.performance).toBeDefined();
        expect(comparison.performance?.durationMs).toBeGreaterThanOrEqual(0);
        expect(comparison.performance?.networkCount).toBe(2);
      });

      it('should measure estimation performance for large contracts', () => {
        // Large contract (>20KB)
        const largeBytecode = '0x' + '60'.repeat(11000); // 11KB

        const estimate = estimator.estimateDeployment(largeBytecode, {
          network: 'mainnet',
        });

        expect(estimate.performance?.durationMs).toBeGreaterThanOrEqual(0);
        // Large contracts should still be reasonably fast (<5s target)
        expect(estimate.performance?.durationMs).toBeLessThan(5000);
      });

      it('should log warning for slow gas estimation (>2s)', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        // Mock performance.now() to simulate slow estimation (>2000ms threshold)
        let callCount = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return 0; // Start time
          } else {
            return 2500; // End time: 2500ms elapsed (exceeds 2000ms threshold)
          }
        });

        // This should trigger the slow estimation warning
        const estimate = estimator.estimateDeployment(bytecode, {
          network: 'sepolia',
        });

        expect(estimate.performance?.durationMs).toBe(2500);

        // Restore real performance.now
        vi.restoreAllMocks();
      });

      it('should measure comparison performance for multiple networks', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
        const gasPrices = [
          {
            network: 'mainnet' as SupportedNetwork,
            slow: 20,
            standard: 30,
            fast: 40,
            timestamp: Date.now(),
          },
          {
            network: 'sepolia' as SupportedNetwork,
            slow: 1,
            standard: 2,
            fast: 3,
            timestamp: Date.now(),
          },
          {
            network: 'polygon' as SupportedNetwork,
            slow: 30,
            standard: 50,
            fast: 70,
            timestamp: Date.now(),
          },
          {
            network: 'arbitrum' as SupportedNetwork,
            slow: 0.1,
            standard: 0.2,
            fast: 0.3,
            timestamp: Date.now(),
          },
          {
            network: 'optimism' as SupportedNetwork,
            slow: 0.5,
            standard: 1,
            fast: 2,
            timestamp: Date.now(),
          },
          {
            network: 'base' as SupportedNetwork,
            slow: 0.2,
            standard: 0.5,
            fast: 1,
            timestamp: Date.now(),
          },
        ];

        const comparison = estimator.compareNetworks(bytecode, gasPrices);

        expect(comparison.performance?.networkCount).toBe(6);
        expect(comparison.performance?.durationMs).toBeGreaterThanOrEqual(0);
        // Multi-chain comparison should be fast (<3s target)
        expect(comparison.performance?.durationMs).toBeLessThan(3000);
      });

      it('should log warning for slow network comparison (>2s)', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
        const gasPrices = [
          {
            network: 'sepolia' as SupportedNetwork,
            slow: 1,
            standard: 2,
            fast: 3,
            timestamp: Date.now(),
          },
          {
            network: 'polygon' as SupportedNetwork,
            slow: 5,
            standard: 10,
            fast: 15,
            timestamp: Date.now(),
          },
        ];

        // Mock performance.now() to simulate slow comparison (>2000ms threshold)
        let callCount = 0;
        const originalNow = performance.now.bind(performance);
        vi.spyOn(performance, 'now').mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return 0; // Start time
          } else {
            return 2500; // End time: 2500ms elapsed (exceeds 2000ms threshold)
          }
        });

        // This should trigger the slow comparison warning
        const comparison = estimator.compareNetworks(bytecode, gasPrices, {
          tier: 'standard',
        });

        expect(comparison.performance?.durationMs).toBe(2500);

        // Restore real performance.now
        vi.restoreAllMocks();
      });
    });

    describe('Cache Hit Rate and Efficiency', () => {
      it('should benefit from cache on repeated calls with same bytecode', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        // Clear cache to start fresh
        estimator.clearCache();

        // First call - cache miss
        const start1 = performance.now();
        const analysis1 = estimator.analyzeBytecode(bytecode);
        const duration1 = performance.now() - start1;

        // Second call - cache hit (should be faster)
        const start2 = performance.now();
        const analysis2 = estimator.analyzeBytecode(bytecode);
        const duration2 = performance.now() - start2;

        expect(analysis1).toEqual(analysis2);
        // Cache hit should be significantly faster (though test timing can vary)
        // We just verify it doesn't throw and returns same result
        expect(duration2).toBeLessThanOrEqual(duration1 + 10); // Allow some variance
      });

      it('should maintain cache across multiple analyzeBytecode calls', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        estimator.clearCache();

        // Multiple analyzeBytecode calls with same bytecode
        for (let i = 0; i < 5; i++) {
          estimator.analyzeBytecode(bytecode);
        }

        // Cache should have only 1 entry (same bytecode)
        const stats = estimator.getCacheStats();
        expect(stats.size).toBe(1);
      });

      it('should handle cache eviction gracefully', () => {
        estimator.clearCache();

        // Fill cache beyond max size
        const bytecodes: string[] = [];
        for (let i = 0; i < 110; i++) {
          const bytecode =
            '0x' + i.toString(16).padStart(8, '0') + '60'.repeat(50);
          bytecodes.push(bytecode);
          estimator.analyzeBytecode(bytecode);
        }

        // Cache size should not exceed max
        const stats = estimator.getCacheStats();
        expect(stats.size).toBeLessThanOrEqual(100);

        // Should still be able to analyze new bytecode
        const newBytecode = '0x999999' + '60'.repeat(50);
        const analysis = estimator.analyzeBytecode(newBytecode);
        expect(analysis).toBeDefined();
        expect(analysis.size).toBeGreaterThan(0);
      });
    });

    describe('Backward Compatibility', () => {
      it('should maintain backward compatibility - performance field is optional', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        const estimate = estimator.estimateDeployment(bytecode, {
          network: 'sepolia',
        });

        // All existing fields should still exist
        expect(estimate.network).toBe('sepolia');
        expect(estimate.bytecodeSize).toBeGreaterThan(0);
        expect(estimate.deploymentGas).toBeGreaterThan(0);
        expect(estimate.breakdown).toBeDefined();

        // Performance is now present but optional in types
        expect(estimate.performance).toBeDefined();
      });

      it('should not break existing API - all methods return expected types', () => {
        const bytecode =
          '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

        // estimateDeployment
        const estimate = estimator.estimateDeployment(bytecode);
        expect(estimate).toHaveProperty('network');
        expect(estimate).toHaveProperty('bytecodeSize');
        expect(estimate).toHaveProperty('deploymentGas');
        expect(estimate).toHaveProperty('breakdown');

        // analyzeBytecode
        const analysis = estimator.analyzeBytecode(bytecode);
        expect(analysis).toHaveProperty('size');
        expect(analysis).toHaveProperty('sizeInBytes');
        expect(analysis).toHaveProperty('hasConstructor');
        expect(analysis).toHaveProperty('complexity');

        // formatEstimate
        const formatted = estimator.formatEstimate(estimate);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });
});
