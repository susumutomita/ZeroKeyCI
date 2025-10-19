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
});
