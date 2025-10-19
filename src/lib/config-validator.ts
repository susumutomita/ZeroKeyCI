/**
 * Configuration Validator
 * Validates required environment variables and provides helpful error messages
 */

import { logger } from './logger';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FeatureFlags {
  githubOAuthEnabled: boolean;
  litProtocolEnabled: boolean;
}

/**
 * Validates GitHub OAuth configuration
 */
export function validateGitHubOAuth(): {
  isConfigured: boolean;
  errors: string[];
} {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const errors: string[] = [];

  if (!clientId) {
    errors.push('NEXT_PUBLIC_GITHUB_CLIENT_ID is not set');
  }

  if (!clientSecret) {
    errors.push('GITHUB_CLIENT_SECRET is not set');
  }

  return {
    isConfigured: errors.length === 0,
    errors,
  };
}

/**
 * Validates all configuration and returns feature flags
 */
export function validateConfig(): {
  features: FeatureFlags;
  validation: ConfigValidationResult;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check GitHub OAuth
  const githubOAuth = validateGitHubOAuth();
  const githubOAuthEnabled = githubOAuth.isConfigured;

  if (!githubOAuthEnabled) {
    warnings.push(
      'GitHub OAuth is not configured. The /setup page will not work.'
    );
    warnings.push('To enable:');
    warnings.push(
      '1. Create a GitHub OAuth App: https://github.com/settings/developers'
    );
    warnings.push(
      '2. Set NEXT_PUBLIC_GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET'
    );
    warnings.push('3. Restart the application');
  }

  // Check Lit Protocol (optional)
  const litProtocolEnabled =
    !!process.env.PKP_PUBLIC_KEY && !!process.env.LIT_ACTION_IPFS_CID;

  if (!litProtocolEnabled) {
    warnings.push(
      'Lit Protocol is not configured. Automated signing will not work.'
    );
  }

  return {
    features: {
      githubOAuthEnabled,
      litProtocolEnabled,
    },
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings,
    },
  };
}

/**
 * Logs configuration status on application startup
 */
export function logConfigStatus(): FeatureFlags {
  const { features, validation } = validateConfig();

  logger.info('=== Configuration Status ===');

  // Log errors
  /* c8 ignore start */
  if (validation.errors.length > 0) {
    logger.error('Configuration errors:');
    validation.errors.forEach((error) => logger.error(`  - ${error}`));
  }
  /* c8 ignore stop */

  // Log warnings
  if (validation.warnings.length > 0) {
    logger.warn('Configuration warnings:');
    validation.warnings.forEach((warning) => logger.warn(`  ${warning}`));
  }

  // Log feature flags
  logger.info('Feature flags:');
  logger.info(
    `  - GitHub OAuth: ${features.githubOAuthEnabled ? '✓ Enabled' : '✗ Disabled'}`
  );
  logger.info(
    `  - Lit Protocol: ${features.litProtocolEnabled ? '✓ Enabled' : '✗ Disabled'}`
  );
  logger.info('============================');

  return features;
}
