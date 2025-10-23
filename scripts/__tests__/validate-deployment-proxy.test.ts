import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { PolicyValidator } from '../validate-deployment';

describe('PolicyValidator - Proxy Validation', () => {
  const testProposalPath = resolve(process.cwd(), 'test-proposal.json');
  const testPolicyPath = resolve(process.cwd(), '.zerokey', 'policy.rego');
  const zkDir = resolve(process.cwd(), '.zerokey');

  beforeEach(() => {
    // Clean up any existing test files
    if (existsSync(testProposalPath)) {
      unlinkSync(testProposalPath);
    }

    // Ensure .zerokey directory exists
    if (!existsSync(zkDir)) {
      mkdirSync(zkDir, { recursive: true });
    }

    // Create a basic policy file if it doesn't exist
    if (!existsSync(testPolicyPath)) {
      writeFileSync(testPolicyPath, 'package deployment\n');
    }
  });

  afterEach(() => {
    // Clean up test files after each test
    if (existsSync(testProposalPath)) {
      unlinkSync(testProposalPath);
    }
  });

  describe('UUPS Proxy Deployment Validation', () => {
    it('should pass validation for valid UUPS proxy deployment', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            initializeArgs: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass validation for UUPS proxy deployment with empty initializeArgs', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            initializeArgs: [],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail validation when UUPS proxy missing initializeArgs', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            // Missing initializeArgs
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.initialization',
          severity: 'error',
        })
      );
    });

    it('should warn when constructor args provided with UUPS proxy', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: ['arg1', 'arg2'], // Should be empty for upgradeable
          value: '0',
          proxy: {
            type: 'uups',
            initializeArgs: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.warnings).toContainEqual(
        expect.stringContaining('initialize()')
      );
    });
  });

  describe('Transparent Proxy Deployment Validation', () => {
    it('should pass validation for valid Transparent proxy deployment with admin', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'transparent',
            admin: '0x1234567890123456789012345678901234567890',
            initializeArgs: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass validation for Transparent proxy deployment without admin', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'transparent',
            initializeArgs: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail validation when Transparent proxy has invalid admin address', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'transparent',
            admin: '0xinvalid', // Invalid address
            initializeArgs: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.admin',
          severity: 'error',
        })
      );
    });
  });

  describe('UUPS Proxy Upgrade Validation', () => {
    it('should pass validation for valid UUPS proxy upgrade', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPSV2',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            proxyAddress: '0x9876543210987654321098765432109876543210',
            initializeArgs: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass validation for UUPS upgrade without initializeArgs', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPSV2',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            proxyAddress: '0x9876543210987654321098765432109876543210',
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail validation when proxy address is invalid', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPSV2',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            proxyAddress: '0xinvalid', // Invalid address
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.address',
          severity: 'error',
        })
      );
    });

    it('should fail validation when proxy address has no 0x prefix', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPSV2',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            proxyAddress: '9876543210987654321098765432109876543210', // Missing 0x
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.address',
          severity: 'error',
        })
      );
    });

    it('should fail validation when proxy address has wrong length', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPSV2',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'uups',
            proxyAddress: '0x12345', // Too short
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.address',
          severity: 'error',
        })
      );
    });
  });

  describe('Proxy Type Validation', () => {
    it('should fail validation for invalid proxy type', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            type: 'invalid-type', // Invalid
            initializeArgs: [],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.type',
          severity: 'error',
        })
      );
    });

    it('should fail validation when proxy type is missing', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'ExampleUUPS',
          constructorArgs: [],
          value: '0',
          proxy: {
            // Missing type
            initializeArgs: [],
          },
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: 'proxy.type',
          severity: 'error',
        })
      );
    });
  });

  describe('Regular Deployment (No Proxy)', () => {
    it('should pass validation for regular deployment without proxy', () => {
      const proposal = {
        safeAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chainId: 11155111,
        proposal: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0',
          data: '0x608060...',
          operation: 0,
        },
        deployment: {
          network: 'sepolia',
          contract: 'SimpleStorage',
          constructorArgs: [],
          value: '0',
          // No proxy field
        },
        validationHash: '0xabc123',
        metadata: {
          timestamp: Date.now(),
        },
      };

      writeFileSync(testProposalPath, JSON.stringify(proposal, null, 2));

      const validator = new PolicyValidator(testProposalPath, testPolicyPath);
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});
