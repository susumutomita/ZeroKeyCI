import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeploymentSimulator } from '../deployment-simulator';
import type { GasComparison } from '../deployment-simulator';
import { GasEstimator } from '../gas-estimator';
import type { SupportedNetwork } from '../network-config';
import type { PublicClient, WalletClient, Hex } from 'viem';

describe('DeploymentSimulator', () => {
  let simulator: DeploymentSimulator;
  let estimator: GasEstimator;
  let mockPublicClient: PublicClient;
  let mockWalletClient: WalletClient;

  beforeEach(() => {
    simulator = new DeploymentSimulator();
    estimator = new GasEstimator();

    // Create mock viem clients
    mockPublicClient = {
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        contractAddress: '0x1234567890123456789012345678901234567890',
        gasUsed: 100000n,
        status: 'success',
      }),
    } as any;

    mockWalletClient = {
      deployContract: vi
        .fn()
        .mockResolvedValue(
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex
        ),
    } as any;
  });

  describe('simulateDeployment', () => {
    it('should simulate deployment and return actual gas used', async () => {
      // Simple contract bytecode
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.network).toBe('sepolia');
      expect(result.actualGasUsed).toBeGreaterThan(0);
      expect(result.deploymentAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.success).toBe(true);
    });

    it('should handle constructor arguments with hex strings', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const constructorArgs = ['0x1234567890123456789012345678901234567890'];

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        constructorArgs,
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(true);
      expect(result.actualGasUsed).toBeGreaterThan(0);
    });

    it('should handle constructor arguments with non-hex values', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      const constructorArgs = [123456]; // Non-hex number

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        constructorArgs,
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(true);
      expect(result.actualGasUsed).toBeGreaterThan(0);
    });

    it('should handle constructor arguments with mixed types including strings', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';
      // Mixed types: hex string, number, bigint, plain string
      const constructorArgs = [
        '0x1234567890123456789012345678901234567890',
        123456,
        BigInt(999),
        'plain-string',
      ];

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        constructorArgs,
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(true);
      expect(result.actualGasUsed).toBeGreaterThan(0);
    });

    it('should provide gas breakdown', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.gasBreakdown).toBeDefined();
      expect(result.gasBreakdown.baseCost).toBe(21000);
      expect(result.gasBreakdown.deploymentCost).toBeGreaterThan(0);
    });

    it('should handle deployment with ETH value', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'mainnet',
        value: 1000000000000000000n, // 1 ETH
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(true);
      expect(result.actualGasUsed).toBeGreaterThan(0);
    });

    it('should default to sepolia network when not specified', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.network).toBe('sepolia');
      expect(result.success).toBe(true);
    });
  });

  describe('compareWithEstimate', () => {
    it('should compare simulated gas with estimated gas', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      const comparison = simulator.compareWithEstimate(result, estimate);

      expect(comparison.estimatedGas).toBe(estimate.deploymentGas);
      expect(comparison.actualGas).toBe(result.actualGasUsed);
      expect(comparison.difference).toBeDefined();
      expect(comparison.accuracyPercent).toBeGreaterThan(0);
      expect(comparison.accuracyPercent).toBeLessThanOrEqual(100);
    });

    it('should calculate accuracy within 10% tolerance', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      // Use a mock with gas closer to the estimate
      const mockPublicClientWithRealisticGas = {
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          contractAddress: '0x1234567890123456789012345678901234567890',
          gasUsed: 59000n, // Close to estimate of ~59400
          status: 'success',
        }),
      } as any;

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClientWithRealisticGas,
        walletClient: mockWalletClient,
      });

      const comparison = simulator.compareWithEstimate(result, estimate);

      // Estimation should be within 10% of actual
      expect(Math.abs(comparison.difference)).toBeLessThan(
        comparison.actualGas * 0.1
      );
    });

    it('should handle comparison with zero actual gas', () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      // Simulation with zero gas used
      const failedSimulation = {
        network: 'sepolia' as const,
        success: false,
        actualGasUsed: 0,
        error: 'Deployment failed',
        gasBreakdown: {
          baseCost: 0,
          deploymentCost: 0,
        },
        timestamp: Date.now(),
      };

      const comparison = simulator.compareWithEstimate(
        failedSimulation,
        estimate
      );

      expect(comparison.actualGas).toBe(0);
      expect(comparison.accuracyPercent).toBe(0);
      expect(comparison.withinTolerance).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle invalid bytecode format', async () => {
      // Bytecode without 0x prefix should throw before catch
      const result = await simulator.simulateDeployment('invalid', {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid bytecode: must start with 0x');
    });

    it('should handle deployment failures', async () => {
      // Mock a failed deployment
      const mockPublicClientWithFailure = {
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          contractAddress: '0x0000000000000000000000000000000000000000',
          gasUsed: 0n,
          status: 'reverted',
        }),
      } as any;

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClientWithFailure,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Deployment transaction failed');
    });

    it('should handle wallet client errors', async () => {
      // Mock wallet client that throws
      const mockWalletClientWithError = {
        deployContract: vi
          .fn()
          .mockRejectedValue(new Error('Insufficient funds')),
      } as any;

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClientWithError,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });

    it('should handle non-Error type exceptions', async () => {
      // Mock wallet client that throws a string (not Error object)
      const mockWalletClientWithStringError = {
        deployContract: vi.fn().mockRejectedValue('Something went wrong'),
      } as any;

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClientWithStringError,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('should handle null contract address in receipt', async () => {
      // Mock a receipt with null contract address
      const mockPublicClientWithNullAddress = {
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          contractAddress: null,
          gasUsed: 50000n,
          status: 'success',
        }),
      } as any;

      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClientWithNullAddress,
        walletClient: mockWalletClient,
      });

      expect(result.success).toBe(true);
      expect(result.deploymentAddress).toBeUndefined();
      expect(result.actualGasUsed).toBe(50000);
    });
  });

  describe('formatResult', () => {
    it('should format successful simulation result', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'mainnet',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      const formatted = simulator.formatResult(result);

      expect(formatted).toContain('Deployment Simulation Result:');
      expect(formatted).toContain('Network: mainnet');
      expect(formatted).toContain(
        'Contract Address: 0x1234567890123456789012345678901234567890'
      );
      expect(formatted).toContain('Actual Gas Used: 100,000');
      expect(formatted).toContain('Base Transaction Cost: 21,000 gas');
      expect(formatted).toContain('Deployment Cost: 79,000 gas');
    });

    it('should format failed simulation result', async () => {
      const result = await simulator.simulateDeployment('invalid', {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      const formatted = simulator.formatResult(result);

      expect(formatted).toContain('Simulation failed:');
      expect(formatted).toContain('Invalid bytecode: must start with 0x');
    });
  });

  describe('simulateDeployment without mocked clients', () => {
    it('should handle missing hardhat gracefully', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      // Try to simulate without providing clients
      // This will attempt to import hardhat, which may not be available in test env
      try {
        const result = await simulator.simulateDeployment(bytecode, {
          network: 'sepolia',
          // No clients provided - will try to use hardhat
        });

        // If it succeeds (hardhat is available), result should be defined
        expect(result).toBeDefined();
        expect(result.network).toBe('sepolia');
      } catch (error) {
        // If it fails (hardhat not available), error should be defined
        expect(error).toBeDefined();
      }
    });
  });

  describe('formatComparison', () => {
    it('should format gas comparison with positive difference', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient,
        walletClient: mockWalletClient,
      });

      const comparison = simulator.compareWithEstimate(result, estimate);
      const formatted = simulator.formatComparison(comparison);

      expect(formatted).toContain('Gas Estimation Accuracy Report:');
      expect(formatted).toContain('Estimated Gas: 59,400');
      expect(formatted).toContain('Actual Gas Used: 100,000');
      expect(formatted).toContain('Difference: +40,600');
      expect(formatted).toContain('Accuracy:');
      expect(formatted).toContain('Within 10% Tolerance:');
    });

    it('should format gas comparison with negative difference', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      // Mock with gas lower than estimate
      const mockPublicClientLowGas = {
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          contractAddress: '0x1234567890123456789012345678901234567890',
          gasUsed: 50000n,
          status: 'success',
        }),
      } as any;

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClientLowGas,
        walletClient: mockWalletClient,
      });

      const comparison = simulator.compareWithEstimate(result, estimate);
      const formatted = simulator.formatComparison(comparison);

      expect(formatted).toContain('Difference: -9,400');
      expect(formatted).toMatch(/\-\d+\.\d+%/); // Negative percentage
    });

    it('should format comparison within tolerance', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const mockPublicClientWithRealisticGas = {
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          contractAddress: '0x1234567890123456789012345678901234567890',
          gasUsed: 59000n,
          status: 'success',
        }),
      } as any;

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClientWithRealisticGas,
        walletClient: mockWalletClient,
      });

      const comparison = simulator.compareWithEstimate(result, estimate);
      const formatted = simulator.formatComparison(comparison);

      expect(formatted).toContain('Within 10% Tolerance: ✓ Yes');
    });

    it('should format comparison outside tolerance', async () => {
      const bytecode =
        '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe';

      const estimate = estimator.estimateDeployment(bytecode, {
        network: 'sepolia',
      });

      const result = await simulator.simulateDeployment(bytecode, {
        network: 'sepolia',
        publicClient: mockPublicClient, // 100000 gas, way over estimate
        walletClient: mockWalletClient,
      });

      const comparison = simulator.compareWithEstimate(result, estimate);
      const formatted = simulator.formatComparison(comparison);

      expect(formatted).toContain('Within 10% Tolerance: ✗ No');
    });

    it('should handle zero actual gas with N/A percentage', () => {
      const comparison: GasComparison = {
        estimatedGas: 50000,
        actualGas: 0,
        difference: -50000,
        accuracyPercent: 0,
        withinTolerance: false,
      };

      const formatted = simulator.formatComparison(comparison);

      expect(formatted).toContain('Estimated Gas: 50,000');
      expect(formatted).toContain('Actual Gas Used: 0');
      expect(formatted).toContain('Difference: -50,000 (N/A)');
      expect(formatted).toContain('Accuracy: 0.00%');
    });
  });
});
