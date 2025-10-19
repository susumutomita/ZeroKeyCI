import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateGitHubOAuth,
  validateConfig,
  logConfigStatus,
} from '../config-validator';

describe('config-validator', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateGitHubOAuth', () => {
    it('should return isConfigured=true when both variables are set', () => {
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test_client_id';
      process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';

      const result = validateGitHubOAuth();

      expect(result.isConfigured).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return isConfigured=false when NEXT_PUBLIC_GITHUB_CLIENT_ID is missing', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';

      const result = validateGitHubOAuth();

      expect(result.isConfigured).toBe(false);
      expect(result.errors).toContain(
        'NEXT_PUBLIC_GITHUB_CLIENT_ID is not set'
      );
    });

    it('should return isConfigured=false when GITHUB_CLIENT_SECRET is missing', () => {
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test_client_id';
      delete process.env.GITHUB_CLIENT_SECRET;

      const result = validateGitHubOAuth();

      expect(result.isConfigured).toBe(false);
      expect(result.errors).toContain('GITHUB_CLIENT_SECRET is not set');
    });

    it('should return isConfigured=false when both variables are missing', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;

      const result = validateGitHubOAuth();

      expect(result.isConfigured).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain(
        'NEXT_PUBLIC_GITHUB_CLIENT_ID is not set'
      );
      expect(result.errors).toContain('GITHUB_CLIENT_SECRET is not set');
    });
  });

  describe('validateConfig', () => {
    it('should return githubOAuthEnabled=true when OAuth is configured', () => {
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test_client_id';
      process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';

      const result = validateConfig();

      expect(result.features.githubOAuthEnabled).toBe(true);
      expect(result.validation.warnings).toHaveLength(1); // Only Lit Protocol warning
    });

    it('should return githubOAuthEnabled=false when OAuth is not configured', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;

      const result = validateConfig();

      expect(result.features.githubOAuthEnabled).toBe(false);
      expect(result.validation.warnings.length).toBeGreaterThan(0);
      expect(result.validation.warnings[0]).toContain(
        'GitHub OAuth is not configured'
      );
    });

    it('should return litProtocolEnabled=true when Lit is configured', () => {
      process.env.PKP_PUBLIC_KEY = 'test_pkp_key';
      process.env.LIT_ACTION_IPFS_CID = 'test_ipfs_cid';

      const result = validateConfig();

      expect(result.features.litProtocolEnabled).toBe(true);
    });

    it('should return litProtocolEnabled=false when Lit is not configured', () => {
      delete process.env.PKP_PUBLIC_KEY;
      delete process.env.LIT_ACTION_IPFS_CID;

      const result = validateConfig();

      expect(result.features.litProtocolEnabled).toBe(false);
    });

    it('should have isValid=true when no errors (only warnings)', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

      const result = validateConfig();

      expect(result.validation.isValid).toBe(true); // No errors, only warnings
      expect(result.validation.errors).toHaveLength(0);
      expect(result.validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('logConfigStatus', () => {
    it('should return feature flags', () => {
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test_client_id';
      process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';

      const features = logConfigStatus();

      expect(features).toHaveProperty('githubOAuthEnabled');
      expect(features).toHaveProperty('litProtocolEnabled');
      expect(features.githubOAuthEnabled).toBe(true);
    });

    it('should not throw when config is missing', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;

      expect(() => logConfigStatus()).not.toThrow();
    });

    it('should log warnings when OAuth is not configured', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;

      const features = logConfigStatus();

      expect(features.githubOAuthEnabled).toBe(false);
      // Validation should have warnings, not errors
      const result = validateConfig();
      expect(result.validation.warnings.length).toBeGreaterThan(0);
      expect(result.validation.errors.length).toBe(0);
    });
  });
});
