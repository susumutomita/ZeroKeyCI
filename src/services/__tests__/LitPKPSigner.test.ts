import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LitPKPSigner } from '../LitPKPSigner';
import type { SafeTransactionData } from '../../types/safe';

// Mock Lit Protocol SDK
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockExecuteJs = vi.fn().mockResolvedValue({
  signatures: {
    sig1: {
      r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      s: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      recid: 0,
      signature:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefabcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789001',
      publicKey:
        '0x04abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      dataSigned: '0xabcdef',
    },
  },
  logs: 'Signing successful',
  success: true,
});

vi.mock('@lit-protocol/lit-node-client', () => ({
  LitNodeClient: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    executeJs: mockExecuteJs,
  })),
}));

vi.mock('@lit-protocol/auth-helpers', () => ({
  LitAuthClient: vi.fn().mockImplementation(() => ({
    getSessionSigs: vi.fn().mockResolvedValue({
      'https://lit-protocol.com': {
        sig: '0xsignaturesample',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'message',
        address: '0x1234567890123456789012345678901234567890',
      },
    }),
  })),
}));

describe('LitPKPSigner', () => {
  let signer: LitPKPSigner;

  // Valid uncompressed public key: 0x04 + 64 bytes (128 hex chars) = 132 total chars
  const mockPKPPublicKey = '0x04' + '1234567890abcdef'.repeat(8);
  const mockAuthSig = {
    sig: '0xsignaturesample',
    derivedVia: 'web3.eth.personal.sign',
    signedMessage: 'message',
    address: '0x1234567890123456789012345678901234567890',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create an instance with valid configuration', () => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });

      expect(signer).toBeInstanceOf(LitPKPSigner);
    });

    it('should throw error with invalid PKP public key', () => {
      expect(() => {
        new LitPKPSigner({
          pkpPublicKey: 'invalid-key',
          network: 'cayenne',
        });
      }).toThrow('Invalid PKP public key');
    });

    it('should throw error without PKP public key', () => {
      expect(() => {
        new LitPKPSigner({
          pkpPublicKey: '',
          network: 'cayenne',
        });
      }).toThrow('PKP public key is required');
    });

    it('should throw error without network', () => {
      expect(() => {
        new LitPKPSigner({
          pkpPublicKey: mockPKPPublicKey,
          network: '',
        });
      }).toThrow('Lit network is required');
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
    });

    it('should connect to Lit network successfully', async () => {
      await expect(signer.connect()).resolves.not.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      // Temporarily mock connect to fail
      mockConnect.mockRejectedValueOnce(new Error('Network error'));

      await expect(signer.connect()).rejects.toThrow('Network error');

      // Restore mock
      mockConnect.mockResolvedValue(undefined);
    });
  });

  describe('disconnect', () => {
    beforeEach(async () => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
      await signer.connect();
    });

    it('should disconnect from Lit network successfully', async () => {
      await expect(signer.disconnect()).resolves.not.toThrow();
    });
  });

  describe('signSafeTransaction', () => {
    beforeEach(async () => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
      await signer.connect();
    });

    const mockSafeTransaction: SafeTransactionData = {
      to: '0x1234567890123456789012345678901234567890',
      value: '0',
      data: '0xabcdef',
      operation: 0,
    };

    it('should sign a Safe transaction successfully', async () => {
      const signature = await signer.signSafeTransaction(
        mockSafeTransaction,
        mockAuthSig
      );

      expect(signature).toBeDefined();
      expect(signature).toHaveProperty('r');
      expect(signature).toHaveProperty('s');
      expect(signature).toHaveProperty('v');
      expect(typeof signature.r).toBe('string');
      expect(typeof signature.s).toBe('string');
      expect(typeof signature.v).toBe('number');
    });

    it('should throw error if not connected', async () => {
      const disconnectedSigner = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });

      await expect(
        disconnectedSigner.signSafeTransaction(mockSafeTransaction, mockAuthSig)
      ).rejects.toThrow('Not connected to Lit network');
    });

    it('should throw error with invalid Safe transaction', async () => {
      const invalidTransaction = {
        to: 'invalid-address',
        value: '0',
        data: '0x',
        operation: 0,
      } as SafeTransactionData;

      await expect(
        signer.signSafeTransaction(invalidTransaction, mockAuthSig)
      ).rejects.toThrow();
    });

    it('should throw error without authentication signature', async () => {
      await expect(
        signer.signSafeTransaction(mockSafeTransaction, null as any)
      ).rejects.toThrow('Authentication signature is required');
    });

    it('should handle signing failures gracefully', async () => {
      // Temporarily mock executeJs to fail
      mockExecuteJs.mockResolvedValueOnce({
        signatures: {},
        logs: 'Signing failed',
        success: false,
      });

      await expect(
        signer.signSafeTransaction(mockSafeTransaction, mockAuthSig)
      ).rejects.toThrow('Failed to sign transaction');

      // Restore mock
      mockExecuteJs.mockResolvedValue({
        signatures: {
          sig1: {
            r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            s: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            recid: 0,
          },
        },
        logs: 'Signing successful',
        success: true,
      });
    });
  });

  describe('getPKPEthAddress', () => {
    beforeEach(() => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
    });

    it('should derive Ethereum address from PKP public key', () => {
      const address = signer.getPKPEthAddress();

      expect(address).toBeDefined();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return consistent address for same public key', () => {
      const address1 = signer.getPKPEthAddress();
      const address2 = signer.getPKPEthAddress();

      expect(address1).toBe(address2);
    });
  });

  describe('verifyConditions', () => {
    beforeEach(() => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
    });

    it('should verify all conditions successfully', async () => {
      const conditions = {
        opaPolicyPassed: true,
        testsPassed: true,
        prMerged: true,
      };

      const result = await signer.verifyConditions(conditions);

      expect(result).toBe(true);
    });

    it('should return false if OPA policy failed', async () => {
      const conditions = {
        opaPolicyPassed: false,
        testsPassed: true,
        prMerged: true,
      };

      const result = await signer.verifyConditions(conditions);

      expect(result).toBe(false);
    });

    it('should return false if tests failed', async () => {
      const conditions = {
        opaPolicyPassed: true,
        testsPassed: false,
        prMerged: true,
      };

      const result = await signer.verifyConditions(conditions);

      expect(result).toBe(false);
    });

    it('should return false if PR not merged', async () => {
      const conditions = {
        opaPolicyPassed: true,
        testsPassed: true,
        prMerged: false,
      };

      const result = await signer.verifyConditions(conditions);

      expect(result).toBe(false);
    });

    it('should throw error with missing conditions', async () => {
      await expect(signer.verifyConditions(null as any)).rejects.toThrow(
        'Conditions are required'
      );
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(async () => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
      await signer.connect();
    });

    it('should support full signing workflow', async () => {
      const mockTransaction: SafeTransactionData = {
        to: '0x1234567890123456789012345678901234567890',
        value: '0',
        data: '0xabcdef',
        operation: 0,
      };

      // 1. Verify conditions
      const conditionsValid = await signer.verifyConditions({
        opaPolicyPassed: true,
        testsPassed: true,
        prMerged: true,
      });
      expect(conditionsValid).toBe(true);

      // 2. Get PKP address
      const pkpAddress = signer.getPKPEthAddress();
      expect(pkpAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // 3. Sign transaction
      const signature = await signer.signSafeTransaction(
        mockTransaction,
        mockAuthSig
      );
      expect(signature).toBeDefined();
      expect(signature.r).toBeDefined();
      expect(signature.s).toBeDefined();
      expect(signature.v).toBeDefined();
    });

    it('should reject signing if conditions not met', async () => {
      const conditionsValid = await signer.verifyConditions({
        opaPolicyPassed: false,
        testsPassed: true,
        prMerged: true,
      });

      expect(conditionsValid).toBe(false);

      // Should not proceed with signing if conditions not met
      // (implementation will check this in the actual service)
    });
  });

  describe('Error handling', () => {
    it('should handle network disconnection during signing', async () => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
      await signer.connect();
      await signer.disconnect();

      const mockTransaction: SafeTransactionData = {
        to: '0x1234567890123456789012345678901234567890',
        value: '0',
        data: '0xabcdef',
        operation: 0,
      };

      await expect(
        signer.signSafeTransaction(mockTransaction, mockAuthSig)
      ).rejects.toThrow('Not connected to Lit network');
    });

    it('should validate Safe transaction structure', async () => {
      signer = new LitPKPSigner({
        pkpPublicKey: mockPKPPublicKey,
        network: 'cayenne',
      });
      await signer.connect();

      const invalidTransaction = {
        // Missing required fields
        to: '0x1234567890123456789012345678901234567890',
      } as SafeTransactionData;

      await expect(
        signer.signSafeTransaction(invalidTransaction, mockAuthSig)
      ).rejects.toThrow();
    });
  });
});
