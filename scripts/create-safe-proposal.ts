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

async function main() {
  try {
    // Read deployment configuration
    const configPath = resolve(process.cwd(), '.zerokey', 'deploy.yaml');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent) as DeployConfig;

    // Validate environment variables
    const safeAddress = process.env.SAFE_ADDRESS;
    if (!safeAddress) {
      throw new Error('SAFE_ADDRESS environment variable is required');
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
      throw new Error(`Unsupported network: ${config.network}`);
    }

    // Read compiled contract artifact
    const artifactPath = resolve(
      process.cwd(),
      'artifacts',
      'contracts',
      `${config.contract}.sol`,
      `${config.contract}.json`
    );

    if (!require('fs').existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found: ${artifactPath}`);
    }

    const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));

    // Validate contract has bytecode
    if (!artifact.bytecode || artifact.bytecode === '0x') {
      throw new Error(`No bytecode found for contract ${config.contract}`);
    }

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
    console.log('🔐 Creating Safe deployment proposal...');
    console.log(`  Network: ${config.network} (chainId: ${chainId})`);
    console.log(`  Contract: ${config.contract}`);
    console.log(`  Safe: ${safeAddress}`);

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

    // Validate the proposal
    if (!builder.validateProposal(proposal)) {
      throw new Error('Generated proposal failed validation');
    }

    // Calculate deployment address (for logging)
    const salt = '0x' + '0'.repeat(64); // Default salt
    const deploymentAddress = builder.calculateDeploymentAddress(
      artifact.bytecode,
      salt
    );

    console.log(`  Deployment Address: ${deploymentAddress}`);

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

    console.log('✅ Safe proposal created successfully');
    console.log(`📝 Proposal saved to: ${outputPath}`);
    console.log(`🔑 Validation Hash: ${parsed.validationHash}`);

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

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Safe proposal:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
