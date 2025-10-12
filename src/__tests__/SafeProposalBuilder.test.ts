import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SafeProposalBuilder } from '../services/SafeProposalBuilder';
import type { SafeTransactionData } from '../types/safe';

describe('SafeProposalBuilder', () => {
  let builder: SafeProposalBuilder;

  beforeEach(() => {
    builder = new SafeProposalBuilder({
      safeAddress: '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0',
      chainId: 11155111, // Sepolia
    });
  });

  describe('constructor', () => {
    it('should initialize with safe address and chain ID', () => {
      expect(builder.getSafeAddress()).toBe(
        '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'
      );
      expect(builder.getChainId()).toBe(11155111);
    });

    it('should validate safe address format', () => {
      expect(() => {
        new SafeProposalBuilder({
          safeAddress: 'invalid-address',
          chainId: 1,
        });
      }).toThrow('Invalid safe address');
    });

    it('should validate chain ID', () => {
      expect(() => {
        new SafeProposalBuilder({
          safeAddress: '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0',
          chainId: 0,
        });
      }).toThrow('Invalid chain ID');
    });
  });

  describe('createDeploymentProposal', () => {
    it('should create a deployment proposal without private keys', async () => {
      const deploymentData = {
        contractName: 'ExampleUUPS',
        bytecode: '0x608060405234801561001057600080fd5b50',
        constructorArgs: [],
        value: '0',
      };

      const proposal = await builder.createDeploymentProposal(deploymentData);

      expect(proposal).toHaveProperty('to');
      expect(proposal).toHaveProperty('value');
      expect(proposal).toHaveProperty('data');
      expect(proposal).toHaveProperty('operation');
      expect(proposal.value).toBe('0');
      expect(proposal.operation).toBe(0); // Call operation
      expect(proposal.to).toBe('0x0000000000000000000000000000000000000000'); // CREATE operation
    });

    it('should include deployment metadata', async () => {
      const deploymentData = {
        contractName: 'ExampleUUPS',
        bytecode: '0x608060405234801561001057600080fd5b50',
        constructorArgs: ['arg1', 42],
        value: '0',
        metadata: {
          pr: 'feat/safe-sdk',
          commit: 'abc123',
          deployer: 'CI/CD Pipeline',
        },
      };

      const proposal = await builder.createDeploymentProposal(deploymentData);
      const metadata = builder.getMetadata();

      expect(metadata).toEqual({
        pr: 'feat/safe-sdk',
        commit: 'abc123',
        deployer: 'CI/CD Pipeline',
        timestamp: expect.any(Number),
        contractName: 'ExampleUUPS',
      });
    });
  });

  describe('createUpgradeProposal', () => {
    it('should create an upgrade proposal for UUPS proxy', async () => {
      const upgradeData = {
        proxyAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        newImplementation: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        functionSelector: 'upgradeTo(address)',
      };

      const proposal = await builder.createUpgradeProposal(upgradeData);

      expect(proposal.to).toBe('0x5FbDB2315678afecb367f032d93F642f64180aa3');
      expect(proposal.value).toBe('0');
      expect(proposal.operation).toBe(0); // Call operation
      expect(proposal.data).toMatch(/^0x/); // Starts with 0x (encoded function call)
    });

    it('should validate proxy address', async () => {
      const upgradeData = {
        proxyAddress: 'invalid-address',
        newImplementation: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        functionSelector: 'upgradeTo(address)',
      };

      await expect(builder.createUpgradeProposal(upgradeData)).rejects.toThrow(
        'Invalid proxy address'
      );
    });

    it('should validate implementation address', async () => {
      const upgradeData = {
        proxyAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        newImplementation: 'invalid-address',
        functionSelector: 'upgradeTo(address)',
      };

      await expect(builder.createUpgradeProposal(upgradeData)).rejects.toThrow(
        'Invalid implementation address'
      );
    });
  });

  describe('serializeProposal', () => {
    it('should serialize proposal to JSON format', async () => {
      const deploymentData = {
        contractName: 'ExampleUUPS',
        bytecode: '0x608060405234801561001057600080fd5b50',
        constructorArgs: [],
        value: '0',
      };

      const proposal = await builder.createDeploymentProposal(deploymentData);
      const serialized = builder.serializeProposal(proposal);

      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed).toHaveProperty('proposal');
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('safeAddress');
      expect(parsed).toHaveProperty('chainId');
    });

    it('should include validation hash', async () => {
      const deploymentData = {
        contractName: 'ExampleUUPS',
        bytecode: '0x608060405234801561001057600080fd5b50',
        constructorArgs: [],
        value: '0',
      };

      const proposal = await builder.createDeploymentProposal(deploymentData);
      const serialized = builder.serializeProposal(proposal);
      const parsed = JSON.parse(serialized);

      expect(parsed).toHaveProperty('validationHash');
      expect(parsed.validationHash).toMatch(/^0x[a-f0-9]{64}$/); // Valid hash format
    });
  });

  describe('validateProposal', () => {
    it('should validate a valid proposal', async () => {
      const deploymentData = {
        contractName: 'ExampleUUPS',
        bytecode: '0x608060405234801561001057600080fd5b50',
        constructorArgs: [],
        value: '0',
      };

      const proposal = await builder.createDeploymentProposal(deploymentData);
      const isValid = builder.validateProposal(proposal);

      expect(isValid).toBe(true);
    });

    it('should reject proposal with invalid to address', async () => {
      const proposal: SafeTransactionData = {
        to: 'invalid-address',
        value: '0',
        data: '0x',
        operation: 0,
      };

      const isValid = builder.validateProposal(proposal);
      expect(isValid).toBe(false);
    });

    it('should reject proposal with negative value', async () => {
      const proposal: SafeTransactionData = {
        to: '0x0000000000000000000000000000000000000000',
        value: '-1',
        data: '0x',
        operation: 0,
      };

      const isValid = builder.validateProposal(proposal);
      expect(isValid).toBe(false);
    });

    it('should reject proposal with invalid operation', async () => {
      const proposal: SafeTransactionData = {
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        data: '0x',
        operation: 3, // Invalid operation (should be 0 or 1)
      };

      const isValid = builder.validateProposal(proposal);
      expect(isValid).toBe(false);
    });
  });

  describe('batch proposals', () => {
    it('should create batch transaction proposal', async () => {
      const deploymentData = {
        contractName: 'ExampleUUPS',
        bytecode: '0x608060405234801561001057600080fd5b50',
        constructorArgs: [],
        value: '0',
      };

      const upgradeData = {
        proxyAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        newImplementation: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        functionSelector: 'upgradeTo(address)',
      };

      const deployProposal =
        await builder.createDeploymentProposal(deploymentData);
      const upgradeProposal = await builder.createUpgradeProposal(upgradeData);

      const batchProposal = builder.createBatchProposal([
        deployProposal,
        upgradeProposal,
      ]);

      expect(batchProposal).toHaveProperty('transactions');
      expect(batchProposal.transactions).toHaveLength(2);
      expect(batchProposal.transactions[0]).toEqual(deployProposal);
      expect(batchProposal.transactions[1]).toEqual(upgradeProposal);
    });
  });

  describe('deterministic addresses', () => {
    it('should calculate deterministic deployment address', () => {
      const bytecode = '0x608060405234801561001057600080fd5b50';
      const salt = '0x' + '0'.repeat(64); // Zero salt

      const address = builder.calculateDeploymentAddress(bytecode, salt);

      expect(address).toMatch(/^0x[a-f0-9]{40}$/i); // Valid ethereum address
      // Address should be deterministic - same inputs = same output
      const address2 = builder.calculateDeploymentAddress(bytecode, salt);
      expect(address2).toBe(address);
    });

    it('should generate different addresses for different bytecode', () => {
      const bytecode1 = '0x608060405234801561001057600080fd5b50';
      const bytecode2 = '0x608060405234801561001057600080fd5b51';
      const salt = '0x' + '0'.repeat(64);

      const address1 = builder.calculateDeploymentAddress(bytecode1, salt);
      const address2 = builder.calculateDeploymentAddress(bytecode2, salt);

      expect(address1).not.toBe(address2);
    });

    it('should generate different addresses for different salt', () => {
      const bytecode = '0x608060405234801561001057600080fd5b50';
      const salt1 = '0x' + '0'.repeat(64);
      const salt2 = '0x' + '1'.repeat(64);

      const address1 = builder.calculateDeploymentAddress(bytecode, salt1);
      const address2 = builder.calculateDeploymentAddress(bytecode, salt2);

      expect(address1).not.toBe(address2);
    });
  });
});
