import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tests for Lit Action: Conditional Safe Transaction Signer
 *
 * These tests verify the conditional signing logic by simulating
 * the Lit Protocol execution environment and validating behavior
 * for different condition combinations.
 */

describe('Lit Action: Conditional Signer', () => {
  let litActionCode: string;

  // Mock Lit Actions global
  const mockLitActions = {
    signEcdsa: vi.fn().mockResolvedValue(undefined),
    setResponse: vi.fn(),
  };

  // Mock globalThis for Lit Action environment
  const createMockGlobalThis = (params: any) => ({
    ...globalThis,
    params,
    LitActions: mockLitActions,
    fetch: vi.fn(),
  });

  beforeEach(() => {
    // Load the compiled Lit Action code
    const litActionPath = join(__dirname, '../conditionalSigner.js');
    litActionCode = readFileSync(litActionPath, 'utf-8');

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Parameter Validation', () => {
    it('should throw error if dataToSign is missing', async () => {
      const params = {
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: false,
        },
      };

      const mockGlobal = createMockGlobalThis(params);

      await expect(async () => {
        await eval(`(function() {
          const globalThis = ${JSON.stringify(mockGlobal)};
          ${litActionCode}
        })()`);
      }).rejects.toThrow();
    });

    it('should throw error if publicKey is missing', async () => {
      const params = {
        dataToSign: new Uint8Array(32),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: false,
        },
      };

      const mockGlobal = createMockGlobalThis(params);

      await expect(async () => {
        await eval(`(function() {
          const globalThis = ${JSON.stringify(mockGlobal)};
          ${litActionCode}
        })()`);
      }).rejects.toThrow();
    });

    it('should throw error if conditions are missing', async () => {
      const params = {
        dataToSign: new Uint8Array(32),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
      };

      const mockGlobal = createMockGlobalThis(params);

      await expect(async () => {
        await eval(`(function() {
          const globalThis = ${JSON.stringify(mockGlobal)};
          ${litActionCode}
        })()`);
      }).rejects.toThrow();
    });
  });

  describe('Conditional Signing Logic', () => {
    it('should sign when all conditions are disabled (allow all)', async () => {
      // This test verifies that when all conditions are disabled/false,
      // the Lit Action treats it as "skip checks" and proceeds with signing
      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false, // Disabled - skip check
          testsPassed: false, // Disabled - skip check
          prMerged: false, // Disabled - skip check
        },
      };

      // Execute Lit Action in simulated environment
      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
      };

      const executeAction = new Function(
        'globalThis',
        `
        ${litActionCode}
      `
      );

      await executeAction(context);

      // Verify signature was created
      expect(mockLitActions.signEcdsa).toHaveBeenCalledWith({
        toSign: params.dataToSign,
        publicKey: params.publicKey,
        sigName: 'safeTxSig',
      });

      // Verify success response
      expect(mockLitActions.setResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining('"success":true'),
        })
      );
    });

    it('should refuse to sign when OPA policy check is enabled but fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { allow: false, violations: ['Invalid network'] },
        }),
      });

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: true, // Enabled - must check
          testsPassed: false,
          prMerged: false,
        },
        opa: {
          policyEndpoint: 'http://opa-server/v1/data/deployment/allow',
          deploymentConfig: { network: 'invalid' },
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await expect(executeAction(context)).rejects.toThrow();

      // Verify signature was NOT created
      expect(mockLitActions.signEcdsa).not.toHaveBeenCalled();

      // Verify error response
      expect(mockLitActions.setResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining('"success":false'),
        })
      );
    });

    it('should refuse to sign when tests check is enabled but fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          conclusion: 'failure',
          details: 'Test suite failed',
        }),
      });

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: true, // Enabled - must check
          prMerged: false,
        },
        tests: {
          testResultsUrl:
            'https://api.github.com/repos/owner/repo/actions/runs/123',
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await expect(executeAction(context)).rejects.toThrow();

      expect(mockLitActions.signEcdsa).not.toHaveBeenCalled();
    });

    it('should refuse to sign when PR merge check is enabled but PR not merged', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          merged: false,
          merged_at: null,
        }),
      });

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: true, // Enabled - must check
        },
        github: {
          repoOwner: 'susumutomita',
          repoName: 'ZeroKeyCI',
          prNumber: 30,
          githubToken: 'ghp_mocktoken',
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await expect(executeAction(context)).rejects.toThrow();

      expect(mockLitActions.signEcdsa).not.toHaveBeenCalled();
    });

    it('should sign when all enabled conditions pass', async () => {
      const mockFetch = vi
        .fn()
        // OPA policy check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { allow: true },
          }),
        })
        // Tests check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            conclusion: 'success',
          }),
        })
        // PR merge check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            merged: true,
            merged_at: '2025-10-18T00:00:00Z',
          }),
        });

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: true,
          testsPassed: true,
          prMerged: true,
        },
        opa: {
          policyEndpoint: 'http://opa-server/v1/data/deployment/allow',
          deploymentConfig: { network: 'sepolia' },
        },
        tests: {
          testResultsUrl:
            'https://api.github.com/repos/owner/repo/actions/runs/123',
        },
        github: {
          repoOwner: 'susumutomita',
          repoName: 'ZeroKeyCI',
          prNumber: 30,
          githubToken: 'ghp_mocktoken',
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await executeAction(context);

      // Verify all checks were made
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify signature was created
      expect(mockLitActions.signEcdsa).toHaveBeenCalledWith({
        toSign: params.dataToSign,
        publicKey: params.publicKey,
        sigName: 'safeTxSig',
      });

      // Verify success response
      expect(mockLitActions.setResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining('"success":true'),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle OPA API failures gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: true,
          testsPassed: false,
          prMerged: false,
        },
        opa: {
          policyEndpoint: 'http://opa-server/v1/data/deployment/allow',
          deploymentConfig: {},
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await expect(executeAction(context)).rejects.toThrow();

      expect(mockLitActions.signEcdsa).not.toHaveBeenCalled();
    });

    it('should handle GitHub API failures gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: true,
        },
        github: {
          repoOwner: 'susumutomita',
          repoName: 'ZeroKeyCI',
          prNumber: 9999,
          githubToken: 'ghp_mocktoken',
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await expect(executeAction(context)).rejects.toThrow();

      expect(mockLitActions.signEcdsa).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: true,
          testsPassed: false,
          prMerged: false,
        },
        opa: {
          policyEndpoint: 'http://opa-server/v1/data/deployment/allow',
          deploymentConfig: {},
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
        fetch: mockFetch,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await expect(executeAction(context)).rejects.toThrow();

      expect(mockLitActions.signEcdsa).not.toHaveBeenCalled();
    });
  });

  describe('Audit Trail', () => {
    it('should log all verification steps', async () => {
      const consoleSpy = {
        log: vi.fn(),
        error: vi.fn(),
      };

      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: false,
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: consoleSpy,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await executeAction(context);

      // Verify logging happened
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[Lit Action]')
      );
    });

    it('should include timestamp in success response', async () => {
      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: false,
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await executeAction(context);

      expect(mockLitActions.setResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining('"timestamp"'),
        })
      );
    });

    it('should include verification results in response', async () => {
      const params = {
        dataToSign: Array.from(new Uint8Array(32)),
        publicKey: '0x04' + '1234567890abcdef'.repeat(8),
        conditions: {
          opaPolicyPassed: false,
          testsPassed: false,
          prMerged: false,
        },
      };

      const context: any = {
        params,
        LitActions: mockLitActions,
        console: console,
      };

      const executeAction = new Function('globalThis', litActionCode);

      await executeAction(context);

      expect(mockLitActions.setResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.stringContaining('"verificationResults"'),
        })
      );
    });
  });
});
