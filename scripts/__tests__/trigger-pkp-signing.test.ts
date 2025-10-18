import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import type { SafeTransaction } from '../../src/types/safe';

// Mock modules
vi.mock('fs');
vi.mock('../../src/services/LitPKPSigner');
vi.mock('@safe-global/api-kit', () => ({
  default: vi.fn().mockImplementation(() => ({
    proposeTransaction: vi.fn().mockResolvedValue({
      safeTxHash: '0x' + 'c'.repeat(64),
    }),
  })),
}));

describe.skip('trigger-pkp-signing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup environment variables for tests
    process.env.PKP_PUBLIC_KEY = '0x1234567890123456789012345678901234567890';
    process.env.LIT_ACTION_IPFS_CID = 'QmTest123';
    process.env.LIT_NETWORK = 'datil-dev';
    process.env.SAFE_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    process.env.GITHUB_TOKEN = 'ghp_test123';
    process.env.GITHUB_REPOSITORY = 'test/repo';
    process.env.GITHUB_PR_NUMBER = '42';
  });

  describe.skip('Environment validation', () => {
    it('should throw error when PKP_PUBLIC_KEY is missing', async () => {
      delete process.env.PKP_PUBLIC_KEY;

      const { validateEnvironment } = await import('../trigger-pkp-signing');

      expect(() => validateEnvironment()).toThrow('PKP_PUBLIC_KEY');
    });

    it('should throw error when LIT_ACTION_IPFS_CID is missing', async () => {
      delete process.env.LIT_ACTION_IPFS_CID;

      const { validateEnvironment } = await import('../trigger-pkp-signing');

      expect(() => validateEnvironment()).toThrow('LIT_ACTION_IPFS_CID');
    });

    it('should throw error when SAFE_ADDRESS is missing', async () => {
      delete process.env.SAFE_ADDRESS;

      const { validateEnvironment } = await import('../trigger-pkp-signing');

      expect(() => validateEnvironment()).toThrow('SAFE_ADDRESS');
    });

    it('should validate all required environment variables', async () => {
      const { validateEnvironment } = await import('../trigger-pkp-signing');

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should use default LIT_NETWORK if not specified', async () => {
      delete process.env.LIT_NETWORK;

      const { validateEnvironment } = await import('../trigger-pkp-signing');
      const config = validateEnvironment();

      expect(config.litNetwork).toBe('datil-dev');
    });
  });

  describe('Proposal loading', () => {
    it('should load Safe proposal from JSON file', async () => {
      const mockProposal: SafeTransaction = {
        safe: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        data: '0x608060405234801561001057600080fd5b50',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 0,
        validationHash: 'test-hash',
      };

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockProposal));

      const { loadProposal } = await import('../trigger-pkp-signing');
      const proposal = loadProposal('safe-proposal.json');

      expect(proposal).toEqual(mockProposal);
      expect(readFileSync).toHaveBeenCalledWith('safe-proposal.json', 'utf-8');
    });

    it('should throw error for invalid JSON', async () => {
      vi.mocked(readFileSync).mockReturnValue('invalid json{');

      const { loadProposal } = await import('../trigger-pkp-signing');

      expect(() => loadProposal('safe-proposal.json')).toThrow();
    });

    it('should throw error when proposal file does not exist', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const { loadProposal } = await import('../trigger-pkp-signing');

      expect(() => loadProposal('missing.json')).toThrow('ENOENT');
    });
  });

  describe('PKP signing', () => {
    it('should sign Safe transaction with PKP', async () => {
      const mockProposal: SafeTransaction = {
        safe: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        data: '0x608060405234801561001057600080fd5b50',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 0,
        validationHash: 'test-hash',
      };

      const mockSignature = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(64),
        v: 27,
      };

      const { LitPKPSigner } = await import('../../src/services/LitPKPSigner');
      const mockSign = vi.fn().mockResolvedValue(mockSignature);
      // @ts-expect-error - mocking
      LitPKPSigner.mockImplementation(() => ({
        signSafeTransaction: mockSign,
      }));

      const { signWithPKP } = await import('../trigger-pkp-signing');
      const signature = await signWithPKP(mockProposal);

      expect(signature).toEqual(mockSignature);
      expect(mockSign).toHaveBeenCalledWith(
        mockProposal,
        expect.objectContaining({
          ipfsCid: 'QmTest123',
        })
      );
    });

    it('should handle signing errors gracefully', async () => {
      const mockProposal: SafeTransaction = {
        safe: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        data: '0x608060405234801561001057600080fd5b50',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 0,
        validationHash: 'test-hash',
      };

      const { LitPKPSigner } = await import('../../src/services/LitPKPSigner');
      const mockSign = vi
        .fn()
        .mockRejectedValue(new Error('Lit Action validation failed'));
      // @ts-expect-error - mocking
      LitPKPSigner.mockImplementation(() => ({
        signSafeTransaction: mockSign,
      }));

      const { signWithPKP } = await import('../trigger-pkp-signing');

      await expect(signWithPKP(mockProposal)).rejects.toThrow(
        'Lit Action validation failed'
      );
    });
  });

  describe('Safe transaction submission', () => {
    it.skip('should submit signed transaction to Safe', async () => {
      const mockProposal: SafeTransaction = {
        safe: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        data: '0x608060405234801561001057600080fd5b50',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 0,
        validationHash: 'test-hash',
      };

      const mockSignature = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(64),
        v: 27,
      };

      const mockSafeTxHash = '0x' + 'c'.repeat(64);

      const { submitToSafe } = await import('../trigger-pkp-signing');
      const txHash = await submitToSafe(mockProposal, mockSignature);

      expect(txHash).toBe(mockSafeTxHash);
    });
  });

  describe('GitHub PR status reporting', () => {
    it('should post signing success comment to PR', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123 }),
      });
      global.fetch = mockFetch;

      const { reportToPR } = await import('../trigger-pkp-signing');
      await reportToPR({
        status: 'success',
        safeTxHash: '0x' + 'c'.repeat(64),
        pkpAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repos/test/repo/issues/42/comments'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'token ghp_test123',
          }),
        })
      );
    });

    it('should post signing failure comment to PR', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123 }),
      });
      global.fetch = mockFetch;

      const { reportToPR } = await import('../trigger-pkp-signing');
      await reportToPR({
        status: 'failure',
        error: 'OPA validation failed',
        pkpAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repos/test/repo/issues/42/comments'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('OPA validation failed'),
        })
      );
    });
  });

  describe('Full workflow', () => {
    it.skip('should execute complete PKP signing workflow', async () => {
      const mockProposal: SafeTransaction = {
        safe: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        data: '0x608060405234801561001057600080fd5b50',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 0,
        validationHash: 'test-hash',
      };

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockProposal));

      const mockSignature = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(64),
        v: 27,
      };

      const { LitPKPSigner } = await import('../../src/services/LitPKPSigner');
      // @ts-expect-error - mocking
      LitPKPSigner.mockImplementation(() => ({
        signSafeTransaction: vi.fn().mockResolvedValue(mockSignature),
      }));

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123 }),
      });
      global.fetch = mockFetch;

      const { main } = await import('../trigger-pkp-signing');
      const result = await main('safe-proposal.json');

      expect(result.success).toBe(true);
      expect(result.safeTxHash).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
