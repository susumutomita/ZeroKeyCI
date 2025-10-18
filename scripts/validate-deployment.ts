#!/usr/bin/env bun
/**
 * Validate deployment proposal against OPA policies
 * This ensures all deployments meet security and compliance requirements
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

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
    this.proposal = JSON.parse(readFileSync(proposalPath, 'utf-8'));

    // For now, we'll do simple rule-based validation
    // In production, this would use OPA's Rego language
    this.policy = this.loadPolicy(policyPath);
  }

  private loadPolicy(policyPath: string): any {
    // Parse the .rego file for basic rules
    const regoContent = readFileSync(policyPath, 'utf-8');

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

    return rules;
  }

  validate(): ValidationResult {
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

    return {
      valid: violations.length === 0,
      violations,
      warnings,
    };
  }
}

export async function main() {
  try {
    const proposalPath = resolve(process.cwd(), 'safe-proposal.json');
    const policyPath = resolve(process.cwd(), '.zerokey', 'policy.rego');

    // Check files exist
    if (!require('fs').existsSync(proposalPath)) {
      throw new Error(`Proposal not found: ${proposalPath}`);
    }

    if (!require('fs').existsSync(policyPath)) {
      console.warn(`⚠️  Policy file not found: ${policyPath}`);
      console.log('Using default validation rules...');
    }

    // Validate proposal
    const validator = new PolicyValidator(proposalPath, policyPath);
    const result = validator.validate();

    // Output results
    console.log('🔍 Policy Validation Results:');
    console.log('================================');

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
    }

    if (result.violations.length > 0) {
      console.log('\n❌ Policy Violations:');
      result.violations.forEach((violation) => {
        console.log(
          `   [${violation.severity.toUpperCase()}] ${violation.rule}: ${
            violation.message
          }`
        );
      });
    }

    if (result.valid) {
      console.log('\n✅ Proposal passed all policy checks');
      process.exit(0);
    } else {
      console.log('\n❌ Proposal failed policy validation');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
