#!/usr/bin/env bun
/**
 * Create Safe proposal for smart contract deployment
 * This script is used by GitHub Actions to generate deployment proposals
 * without requiring any private keys
 */

import { SafeProposalBuilder } from '../src/services/SafeProposalBuilder';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'js-yaml';
import { logger } from '../src/lib/logger';
import {
  ConfigurationError,
  DeploymentError,
  ValidationError,
} from '../src/lib/errors';
import { DeploymentTracker } from '../src/lib/deployment-tracker';
import { Notifier } from '../src/lib/notifier';

interface DeployConfig {
  network: string;
  contract: string;
  constructorArgs?: any[];
  value?: string;
  gasLimit?: number;
  gasPrice?: string;
  signers?: {
    threshold: number;
    addresses: string[];
  };
}

/**
 * Send notification with timeout to prevent deployment delays
 * @param notifier - Notifier instance
 * @param payload - Notification payload
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 */
async function notifyWithTimeout(
  notifier: Notifier,
  payload: Parameters<Notifier['notify']>[0],
  timeoutMs = 5000
): Promise<void> {
  try {
    await Promise.race([
      notifier.notify(payload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Notification timeout')), timeoutMs)
      ),
    ]);
  } catch (error) {
    logger.warn('Notification failed or timed out', {
      error: (error as Error).message,
      deploymentId: payload.deploymentId,
      status: payload.status,
    });
  }
}

async function main() {
  // Initialize monitoring
  const deploymentId = `deploy-${Date.now()}`;
  const tracker = new DeploymentTracker(logger);
  const notifier = new Notifier({
    github: process.env.GITHUB_TOKEN
      ? {
          enabled: true,
          token: process.env.GITHUB_TOKEN,
          repo: process.env.GITHUB_REPOSITORY || '',
        }
      : { enabled: false },
  });

  try {
    logger.info('Starting Safe proposal creation', { deploymentId });
    tracker.start(deploymentId, {
      workflow: process.env.GITHUB_WORKFLOW || 'local',
      runId: process.env.GITHUB_RUN_ID || 'local',
    });

    // Read deployment configuration
    tracker.startPhase(
      deploymentId,
      'validation',
      'Reading deployment configuration'
    );

    const configPath = resolve(process.cwd(), '.zerokey', 'deploy.yaml');

    if (!require('fs').existsSync(configPath)) {
      throw new ConfigurationError('Deployment configuration not found', {
        configKey: 'deployConfig',
        expectedFormat: 'YAML file at .zerokey/deploy.yaml',
        context: { configPath },
      });
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent) as DeployConfig;

    logger.debug('Deployment configuration loaded', { config });

    // Validate environment variables
    const safeAddress = process.env.SAFE_ADDRESS;
    if (!safeAddress) {
      throw new ConfigurationError('Safe address not configured', {
        configKey: 'SAFE_ADDRESS',
        expectedFormat: '0x-prefixed Ethereum address',
      });
    }

    // Network to chainId mapping
    const chainIds: Record<string, number> = {
      sepolia: 11155111,
      mainnet: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      base: 8453,
    };

    const chainId = chainIds[config.network];
    if (!chainId) {
      throw new ValidationError(`Unsupported network: ${config.network}`, {
        field: 'network',
        value: config.network,
        context: { supportedNetworks: Object.keys(chainIds) },
      });
    }

    tracker.completePhase(
      deploymentId,
      'validation',
      'Configuration validated'
    );
    logger.info('Configuration validated', {
      network: config.network,
      chainId,
    });

    // Read compiled contract artifact
    tracker.startPhase(
      deploymentId,
      'proposal_creation',
      'Reading contract artifact'
    );

    const artifactPath = resolve(
      process.cwd(),
      'artifacts',
      'contracts',
      `${config.contract}.sol`,
      `${config.contract}.json`
    );

    if (!require('fs').existsSync(artifactPath)) {
      throw new ConfigurationError(`Contract artifact not found`, {
        configKey: 'contractArtifact',
        expectedFormat: 'Hardhat compilation artifact JSON',
        context: { artifactPath, contract: config.contract },
      });
    }

    const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));

    // Validate contract has bytecode
    if (!artifact.bytecode || artifact.bytecode === '0x') {
      throw new ValidationError(`No bytecode found for contract`, {
        field: 'bytecode',
        value: artifact.bytecode,
        context: { contract: config.contract, artifactPath },
      });
    }

    logger.debug('Contract artifact loaded', {
      contract: config.contract,
      bytecodeLength: artifact.bytecode.length,
    });

    // Initialize Safe proposal builder
    const builder = new SafeProposalBuilder({
      safeAddress,
      chainId,
      defaultGasSettings: config.gasLimit
        ? {
            gasLimit: config.gasLimit,
            gasPrice: config.gasPrice,
          }
        : undefined,
    });

    // Create deployment proposal
    logger.info('Creating Safe deployment proposal', {
      network: config.network,
      chainId,
      contract: config.contract,
      safeAddress,
    });

    const proposal = await builder.createDeploymentProposal({
      contractName: config.contract,
      bytecode: artifact.bytecode,
      constructorArgs: config.constructorArgs || [],
      value: config.value || '0',
      metadata: {
        pr: process.env.GITHUB_PR_NUMBER || 'local',
        commit: process.env.GITHUB_SHA || 'local',
        deployer: process.env.GITHUB_ACTOR || 'local',
        author: process.env.GITHUB_PR_AUTHOR || 'local',
        timestamp: Date.now(),
        network: config.network,
      },
    });

    logger.debug('Proposal created', { proposalHash: proposal.validationHash });

    // Validate the proposal
    if (!builder.validateProposal(proposal)) {
      throw new ValidationError('Generated proposal failed validation', {
        field: 'proposal',
        value: proposal,
      });
    }

    logger.debug('Proposal validated successfully');

    // Calculate deployment address (for logging)
    const salt = '0x' + '0'.repeat(64); // Default salt
    const deploymentAddress = builder.calculateDeploymentAddress(
      artifact.bytecode,
      salt
    );

    logger.info('Deployment address calculated', { deploymentAddress });

    // Serialize proposal
    const serialized = builder.serializeProposal(proposal);
    const parsed = JSON.parse(serialized);

    // Add additional metadata for CI
    const enrichedProposal = {
      ...parsed,
      deployment: {
        expectedAddress: deploymentAddress,
        network: config.network,
        chainId,
        contract: config.contract,
      },
      ci: {
        workflow: process.env.GITHUB_WORKFLOW || 'local',
        runId: process.env.GITHUB_RUN_ID || 'local',
        runNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        repository: process.env.GITHUB_REPOSITORY || 'local',
      },
    };

    // Write proposal to file
    const outputPath = resolve(process.cwd(), 'safe-proposal.json');
    writeFileSync(outputPath, JSON.stringify(enrichedProposal, null, 2));

    tracker.completePhase(
      deploymentId,
      'proposal_creation',
      'Proposal saved to file'
    );

    logger.info('✅ Safe proposal created successfully', {
      outputPath,
      validationHash: parsed.validationHash,
      deploymentAddress,
    });

    // Output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const output = [
        `proposal_hash=${parsed.validationHash}`,
        `safe_address=${safeAddress}`,
        `chain_id=${chainId}`,
        `deployment_address=${deploymentAddress}`,
      ].join('\n');

      require('fs').appendFileSync(process.env.GITHUB_OUTPUT, output);
    }

    // Mark deployment as complete
    tracker.complete(deploymentId, {
      proposalHash: parsed.validationHash,
      deploymentAddress,
      outputPath,
    });

    // Send success notification (with timeout to prevent deployment delays)
    await notifyWithTimeout(notifier, {
      deploymentId,
      status: 'completed',
      message: `Safe proposal created for ${config.contract} on ${config.network}`,
      prNumber: process.env.GITHUB_PR_NUMBER
        ? parseInt(process.env.GITHUB_PR_NUMBER)
        : undefined,
      metadata: {
        contract: config.contract,
        network: config.network,
        proposalHash: parsed.validationHash,
        deploymentAddress,
      },
    });

    process.exit(0);
  } catch (error) {
    const err = error as Error;
    logger.error('❌ Error creating Safe proposal', err, {
      deploymentId,
    });

    // Mark deployment as failed
    tracker.fail(deploymentId, err, {
      step: tracker.getProgress(deploymentId).currentPhase || 'unknown',
    });

    // Send failure notification (with timeout to prevent deployment delays)
    await notifyWithTimeout(notifier, {
      deploymentId,
      status: 'failed',
      message: `Failed to create Safe proposal: ${err.message}`,
      prNumber: process.env.GITHUB_PR_NUMBER
        ? parseInt(process.env.GITHUB_PR_NUMBER)
        : undefined,
      error: err,
    });

    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
