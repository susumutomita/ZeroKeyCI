#!/usr/bin/env bun
/**
 * Validate deployment proposal against OPA policies
 * This ensures all deployments meet security and compliance requirements
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { logger } from '../src/lib/logger';
import {
  ValidationError,
  ConfigurationError,
  PolicyValidationError,
} from '../src/lib/errors';

interface PolicyViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  valid: boolean;
  violations: PolicyViolation[];
  warnings: string[];
}

/**
 * Simple OPA policy validator
 * In production, this would use actual OPA engine
 */
export class PolicyValidator {
  private proposal: any;
  private policy: any;

  constructor(proposalPath: string, policyPath: string) {
    logger.debug('Initializing PolicyValidator', {
      proposalPath,
      policyPath,
    });

    try {
      this.proposal = JSON.parse(readFileSync(proposalPath, 'utf-8'));
      logger.debug('Proposal loaded successfully', {
        safeAddress: this.proposal.safeAddress,
        chainId: this.proposal.chainId,
      });
    } catch (error) {
      throw new ConfigurationError('Failed to load proposal', {
        configKey: 'proposalPath',
        cause: error as Error,
        context: { proposalPath },
      });
    }

    // For now, we'll do simple rule-based validation
    // In production, this would use OPA's Rego language
    this.policy = this.loadPolicy(policyPath);
  }

  private loadPolicy(policyPath: string): any {
    logger.debug('Loading policy file', { policyPath });

    let regoContent: string;
    try {
      // Parse the .rego file for basic rules
      regoContent = readFileSync(policyPath, 'utf-8');
    } catch (error) {
      logger.warn('Policy file not found, using default rules', { policyPath });
      return {
        deployment: {},
        signers: {},
        network: {},
        security: {},
      };
    }

    // Extract rules from Rego (simplified)
    const rules: any = {
      deployment: {},
      signers: {},
      network: {},
      security: {},
    };

    // Parse minimum signers threshold
    const thresholdMatch = regoContent.match(/min_signers\s*:=\s*(\d+)/);
    if (thresholdMatch) {
      rules.signers.minThreshold = parseInt(thresholdMatch[1]);
    }

    // Parse allowed networks
    const networksMatch = regoContent.match(
      /allowed_networks\s*:=\s*\[(.*?)\]/s
    );
    if (networksMatch) {
      rules.network.allowed = networksMatch[1]
        .split(',')
        .map((n) => n.trim().replace(/"/g, ''));
    }

    // Parse gas limits
    const gasLimitMatch = regoContent.match(/max_gas_limit\s*:=\s*(\d+)/);
    if (gasLimitMatch) {
      rules.network.maxGasLimit = parseInt(gasLimitMatch[1]);
    }

    logger.debug('Policy rules extracted', { rules });
    return rules;
  }

  /**
   * Validate Ethereum address format (0x + 40 hex chars)
   */
  private validateEthereumAddress(address: string): boolean {
    if (!address.startsWith('0x')) return false;
    if (address.length !== 42) return false;
    const hexChars = address.substring(2);
    return /^[0-9a-fA-F]{40}$/.test(hexChars);
  }

  /**
   * Validate proxy configuration
   */
  private validateProxyConfig(
    deployment: any,
    violations: PolicyViolation[],
    warnings: string[]
  ): void {
    const proxy = deployment.proxy;

    if (!proxy) {
      // No proxy configuration - this is a regular deployment
      return;
    }

    logger.debug('Validating proxy configuration', { proxy });

    // 1. Validate proxy type
    if (!proxy.type || !['uups', 'transparent'].includes(proxy.type)) {
      violations.push({
        rule: 'proxy.type',
        message: `Invalid proxy type: ${proxy.type}. Must be "uups" or "transparent"`,
        severity: 'error',
      });
    }

    // 2. Check if this is a deployment or upgrade
    const isUpgrade = !!proxy.proxyAddress;

    if (isUpgrade) {
      // Validate proxy upgrade
      if (!this.validateEthereumAddress(proxy.proxyAddress)) {
        violations.push({
          rule: 'proxy.address',
          message: `Invalid proxy address: ${proxy.proxyAddress}. Must be valid Ethereum address (0x + 40 hex chars)`,
          severity: 'error',
        });
      }

      // For upgrades, initializeArgs is optional
      logger.debug('Proxy upgrade detected', {
        proxyAddress: proxy.proxyAddress,
      });
    } else {
      // Validate proxy deployment
      if (!proxy.initializeArgs || !Array.isArray(proxy.initializeArgs)) {
        violations.push({
          rule: 'proxy.initialization',
          message:
            'Proxy deployments must provide initializeArgs array (can be empty)',
          severity: 'error',
        });
      }

      // For transparent proxies, validate admin address if provided
      if (proxy.type === 'transparent' && proxy.admin) {
        if (!this.validateEthereumAddress(proxy.admin)) {
          violations.push({
            rule: 'proxy.admin',
            message: `Invalid admin address: ${proxy.admin}. Must be valid Ethereum address`,
            severity: 'error',
          });
        }
      }

      logger.debug('Proxy deployment detected', {
        proxyType: proxy.type,
        hasAdmin: !!proxy.admin,
      });
    }

    // 3. Warn about constructor args with upgradeable contracts
    if (deployment.constructorArgs && deployment.constructorArgs.length > 0) {
      warnings.push(
        'Upgradeable contracts should use initialize() instead of constructor. Constructor args detected.'
      );
    }
  }

  validate(): ValidationResult {
    logger.info('Starting policy validation', {
      safeAddress: this.proposal.safeAddress,
      chainId: this.proposal.chainId,
    });
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];

    // Check Safe address
    if (!this.proposal.safeAddress) {
      violations.push({
        rule: 'safe.required',
        message: 'Safe address is required',
        severity: 'error',
      });
    }

    // Check proposal structure
    if (!this.proposal.proposal) {
      violations.push({
        rule: 'proposal.structure',
        message: 'Invalid proposal structure',
        severity: 'error',
      });
    }

    // Validate proxy configuration if present
    if (this.proposal.deployment) {
      this.validateProxyConfig(this.proposal.deployment, violations, warnings);
    }

    const txData = this.proposal.proposal;

    // Validate transaction data
    if (txData) {
      // Check for CREATE operations (to == 0x0)
      if (
        txData.to === '0x0000000000000000000000000000000000000000' &&
        txData.operation === 0
      ) {
        // This is a deployment
        if (!txData.data || txData.data === '0x') {
          violations.push({
            rule: 'deployment.bytecode',
            message: 'Deployment requires bytecode',
            severity: 'error',
          });
        }
      }

      // Check value transfers
      if (txData.value && txData.value !== '0') {
        warnings.push(`Transaction includes ETH transfer: ${txData.value} wei`);
      }

      // Check gas settings
      if (txData.gasLimit) {
        const maxGas = this.policy.network?.maxGasLimit || 10000000;
        if (parseInt(txData.gasLimit) > maxGas) {
          violations.push({
            rule: 'network.gasLimit',
            message: `Gas limit ${txData.gasLimit} exceeds maximum ${maxGas}`,
            severity: 'error',
          });
        }
      }
    }

    // Check network
    if (this.proposal.chainId) {
      const allowedChains = [1, 11155111, 137, 42161, 10, 8453]; // mainnet, sepolia, polygon, arbitrum, optimism, base
      if (!allowedChains.includes(this.proposal.chainId)) {
        violations.push({
          rule: 'network.allowed',
          message: `Chain ID ${this.proposal.chainId} is not allowed`,
          severity: 'error',
        });
      }
    }

    // Check metadata
    if (!this.proposal.metadata?.timestamp) {
      warnings.push('Proposal missing timestamp metadata');
    }

    // Check validation hash
    if (!this.proposal.validationHash) {
      violations.push({
        rule: 'security.hash',
        message: 'Proposal must include validation hash',
        severity: 'error',
      });
    }

    // Security checks
    if (this.proposal.proposal?.data) {
      const data = this.proposal.proposal.data;

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /selfdestruct/i,
        /delegatecall.*0x0/i,
        /tx\.origin/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(data)) {
          violations.push({
            rule: 'security.pattern',
            message: `Suspicious pattern detected: ${pattern}`,
            severity: 'error',
          });
        }
      }
    }

    const result = {
      valid: violations.length === 0,
      violations,
      warnings,
    };

    logger.info('Policy validation completed', {
      valid: result.valid,
      violationCount: violations.length,
      warningCount: warnings.length,
    });

    return result;
  }
}

export async function main() {
  logger.info('Starting deployment validation');

  try {
    const proposalPath = resolve(process.cwd(), 'safe-proposal.json');
    const policyPath = resolve(process.cwd(), '.zerokey', 'policy.rego');

    // Check files exist
    if (!require('fs').existsSync(proposalPath)) {
      throw new ConfigurationError('Proposal file not found', {
        configKey: 'proposalPath',
        expectedFormat: 'JSON file at project root',
        context: { proposalPath },
      });
    }

    if (!require('fs').existsSync(policyPath)) {
      logger.warn('Policy file not found, using default rules', { policyPath });
    }

    // Validate proposal
    const validator = new PolicyValidator(proposalPath, policyPath);
    const result = validator.validate();

    // Output results
    logger.info('Policy Validation Results');

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        logger.warn(warning);
      });
    }

    if (result.violations.length > 0) {
      result.violations.forEach((violation) => {
        logger.error(`Policy violation: ${violation.rule}`, undefined, {
          rule: violation.rule,
          message: violation.message,
          severity: violation.severity,
        });
      });
    }

    if (result.valid) {
      logger.info('✅ Proposal passed all policy checks');
      process.exit(0);
    } else {
      const error = new PolicyValidationError('Policy validation failed', {
        violations: result.violations.map((v) => v.message),
        proposalData: {
          safeAddress: validator['proposal'].safeAddress,
          chainId: validator['proposal'].chainId,
        },
      });
      logger.error('❌ Proposal failed policy validation', error);
      throw error;
    }
  } catch (error) {
    logger.error('Validation error', error as Error, {
      step: 'policy_validation',
    });
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
