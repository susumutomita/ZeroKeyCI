#!/usr/bin/env bun
/**
 * Create Safe proposals for multi-chain deployment
 * Generates proposals for multiple networks from a single configuration
 */

import { SafeProposalBuilder } from '../src/services/SafeProposalBuilder';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'js-yaml';
import { logger } from '../src/lib/logger';
import { ConfigurationError, ValidationError } from '../src/lib/errors';
import { GasPriceFetcher } from '../src/lib/gas-price-fetcher';
import { GasEstimator } from '../src/lib/gas-estimator';
import { OptimizationReporter } from '../src/lib/optimization-reporter';
import type { SupportedNetwork } from '../src/lib/network-config';

interface DeploymentConfig {
  network: string;
  safeAddress: string;
  contract: string;
  constructorArgs?: any[];
  value?: string;
  gasLimit?: number;
  gasPrice?: string;
  proxy?: {
    type: 'uups' | 'transparent';
    initializeArgs?: any[];
    proxyAddress?: string;
    admin?: string;
  };
}

interface MultiDeployConfig {
  deployments: DeploymentConfig[];
}

const CHAIN_IDS: Record<string, number> = {
  sepolia: 11155111,
  mainnet: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

async function generateProposalForNetwork(
  config: DeploymentConfig,
  artifactPath: string
): Promise<{ proposal: any; gasReport: any }> {
  const chainId = CHAIN_IDS[config.network];
  if (!chainId) {
    throw new ValidationError(`Unsupported network: ${config.network}`, {
      field: 'network',
      value: config.network,
      context: { supportedNetworks: Object.keys(CHAIN_IDS) },
    });
  }

  logger.info(`Processing deployment for ${config.network}`, {
    chainId,
    safe: config.safeAddress,
  });

  // Read contract artifact
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));

  if (!artifact.bytecode || artifact.bytecode === '0x') {
    throw new ValidationError(`No bytecode found for contract`, {
      field: 'bytecode',
      value: artifact.bytecode,
      context: { contract: config.contract, artifactPath },
    });
  }

  // Perform gas analysis
  let gasAnalysisReport;
  try {
    logger.info(`Starting gas analysis for ${config.network}`);

    const gasFetcher = new GasPriceFetcher();
    const gasEstimator = new GasEstimator();
    const reporter = new OptimizationReporter(gasFetcher, gasEstimator);

    gasAnalysisReport = await reporter.generateReport(artifact.bytecode, {
      network: config.network as SupportedNetwork,
      constructorArgs: config.constructorArgs,
      compareNetworks: Object.keys(CHAIN_IDS).filter(
        (n) => n !== config.network
      ) as SupportedNetwork[],
    });

    logger.info(`Gas analysis completed for ${config.network}`, {
      estimatedGas: gasAnalysisReport.estimate.deploymentGas,
      estimatedCost: gasAnalysisReport.estimate.costInUSD,
    });
  } catch (error) {
    logger.warn(`Gas analysis failed for ${config.network}`, {
      error: (error as Error).message,
    });
  }

  // Initialize Safe proposal builder
  const builder = new SafeProposalBuilder({
    safeAddress: config.safeAddress,
    chainId,
    defaultGasSettings: config.gasLimit
      ? {
          gasLimit: config.gasLimit,
          gasPrice: config.gasPrice,
        }
      : undefined,
  });

  // Create deployment proposal
  logger.info(`Creating Safe deployment proposal for ${config.network}`);

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
    throw new ValidationError('Generated proposal failed validation', {
      field: 'proposal',
      value: proposal,
    });
  }

  // Calculate deployment address
  const salt = '0x' + '0'.repeat(64);
  const deploymentAddress = builder.calculateDeploymentAddress(
    artifact.bytecode,
    salt
  );

  // Serialize proposal
  const serialized = builder.serializeProposal(proposal);
  const parsed = JSON.parse(serialized);

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
    gasAnalysis: gasAnalysisReport
      ? {
          estimatedGas: gasAnalysisReport.estimate.deploymentGas,
          estimatedCost: gasAnalysisReport.estimate.costInUSD,
          bytecodeSize: gasAnalysisReport.estimate.bytecodeSize,
          optimizationScore: gasAnalysisReport.optimizationScore,
          recommendations: gasAnalysisReport.recommendations.length,
          networkComparison: gasAnalysisReport.networkComparison
            ? {
                cheapest: gasAnalysisReport.networkComparison.cheapest.network,
                savings: gasAnalysisReport.networkComparison.savings,
              }
            : undefined,
        }
      : undefined,
  };

  logger.info(`✅ Proposal created for ${config.network}`, {
    validationHash: parsed.validationHash,
    deploymentAddress,
  });

  return {
    proposal: enrichedProposal,
    gasReport: gasAnalysisReport,
  };
}

async function main() {
  try {
    const configPath =
      process.argv[2] ||
      resolve(process.cwd(), '.zerokey', 'deploy-multi.yaml');

    logger.info('Starting multi-chain Safe proposal creation', { configPath });

    // Read multi-chain deployment configuration
    if (!existsSync(configPath)) {
      throw new ConfigurationError(
        'Multi-chain deployment configuration not found',
        {
          configKey: 'deployConfig',
          expectedFormat: 'YAML file with deployments array',
          context: { configPath },
        }
      );
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const multiConfig = yaml.load(configContent) as MultiDeployConfig;

    if (!multiConfig.deployments || multiConfig.deployments.length === 0) {
      throw new ConfigurationError('No deployments configured', {
        configKey: 'deployments',
        expectedFormat: 'Array of deployment configurations',
      });
    }

    logger.info(`Found ${multiConfig.deployments.length} deployment(s)`, {
      networks: multiConfig.deployments.map((d) => d.network),
    });

    const results: Array<{
      network: string;
      proposal: any;
      gasReport: any;
    }> = [];

    // Process each deployment
    for (const deployConfig of multiConfig.deployments) {
      const artifactPath = resolve(
        process.cwd(),
        'artifacts',
        'contracts',
        `${deployConfig.contract}.sol`,
        `${deployConfig.contract}.json`
      );

      if (!existsSync(artifactPath)) {
        throw new ConfigurationError(
          `Contract artifact not found for ${deployConfig.contract}`,
          {
            configKey: 'contractArtifact',
            expectedFormat: 'Hardhat compilation artifact JSON',
            context: { artifactPath, contract: deployConfig.contract },
          }
        );
      }

      const { proposal, gasReport } = await generateProposalForNetwork(
        deployConfig,
        artifactPath
      );

      results.push({
        network: deployConfig.network,
        proposal,
        gasReport,
      });

      // Write individual proposal file
      const proposalPath = resolve(
        process.cwd(),
        `safe-proposal-${deployConfig.network}.json`
      );
      writeFileSync(proposalPath, JSON.stringify(proposal, null, 2));
      logger.info(`Proposal saved to ${proposalPath}`);
    }

    // Write summary file
    const summaryPath = resolve(process.cwd(), 'multi-deployment-summary.json');
    const summary = {
      totalDeployments: results.length,
      networks: results.map((r) => r.network),
      deployments: results.map((r) => ({
        network: r.network,
        proposalFile: `safe-proposal-${r.network}.json`,
        expectedAddress: r.proposal.deployment.expectedAddress,
        estimatedCost: r.proposal.gasAnalysis?.estimatedCost,
        chainId: r.proposal.deployment.chainId,
      })),
      timestamp: new Date().toISOString(),
    };

    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    logger.info('✅ Multi-chain deployment proposals created successfully', {
      totalDeployments: results.length,
      summaryFile: summaryPath,
    });

    // Output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const output = [
        `total_deployments=${results.length}`,
        `networks=${results.map((r) => r.network).join(',')}`,
      ].join('\n');

      require('fs').appendFileSync(process.env.GITHUB_OUTPUT, output);
    }

    // Print summary table
    console.log('\n📊 Multi-Chain Deployment Summary:\n');
    console.log(
      '┌─────────────┬──────────────────────────────────────────────┬──────────────┐'
    );
    console.log(
      '│ Network     │ Expected Address                             │ Est. Cost    │'
    );
    console.log(
      '├─────────────┼──────────────────────────────────────────────┼──────────────┤'
    );

    for (const result of results) {
      const network = result.network.padEnd(11);
      const address = result.proposal.deployment.expectedAddress;
      const cost = result.proposal.gasAnalysis?.estimatedCost
        ? `$${result.proposal.gasAnalysis.estimatedCost}`.padEnd(12)
        : 'N/A'.padEnd(12);

      console.log(`│ ${network} │ ${address} │ ${cost} │`);
    }

    console.log(
      '└─────────────┴──────────────────────────────────────────────┴──────────────┘\n'
    );

    process.exit(0);
  } catch (error) {
    const err = error as Error;
    logger.error('❌ Error creating multi-chain Safe proposals', err);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
