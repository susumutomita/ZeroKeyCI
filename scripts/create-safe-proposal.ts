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
import { utils } from 'ethers';
import { logger } from '../src/lib/logger';
import {
  ConfigurationError,
  DeploymentError,
  ValidationError,
} from '../src/lib/errors';
import { DeploymentTracker } from '../src/lib/deployment-tracker';
import { Notifier } from '../src/lib/notifier';
import { GasPriceFetcher } from '../src/lib/gas-price-fetcher';
import { GasEstimator } from '../src/lib/gas-estimator';
import { OptimizationReporter } from '../src/lib/optimization-reporter';
import type { SupportedNetwork } from '../src/lib/network-config';
import SafeApiKit from '@safe-global/api-kit';

interface ProxyConfig {
  type: 'uups' | 'transparent';
  initializeArgs?: any[];
  proxyAddress?: string; // For upgrades
  admin?: string; // For transparent proxy admin address
}

interface DeployConfig {
  network: string;
  contract: string;
  constructorArgs?: any[];
  value?: string;
  gasLimit?: number;
  gasPrice?: string;
  proxy?: ProxyConfig;
  signers?: {
    threshold: number;
    addresses: string[];
  };
}

const projectRoot = process.env.ZERO_KEY_PROJECT_ROOT
  ? resolve(process.env.ZERO_KEY_PROJECT_ROOT)
  : process.env.CALLING_REPO_ROOT
    ? resolve(process.env.CALLING_REPO_ROOT)
    : process.cwd();

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

/**
 * Get Safe wallet owners from on-chain data
 * @param safeAddress - Safe wallet address
 * @param rpcUrl - RPC URL for network connection
 * @returns Array of owner addresses
 */
async function getSafeOwners(
  safeAddress: string,
  rpcUrl: string
): Promise<string[]> {
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Minimal Safe contract ABI for getOwners()
    const safeAbi = [
      'function getOwners() external view returns (address[] memory)',
    ];

    const safeContract = new ethers.Contract(safeAddress, safeAbi, provider);
    const owners = await safeContract.getOwners();

    logger.debug('Retrieved Safe owners', {
      safeAddress,
      ownerCount: owners.length,
      owners,
    });

    return owners;
  } catch (error) {
    logger.error('Failed to fetch Safe owners', {
      safeAddress,
      error: (error as Error).message,
    });
    throw new Error(`Cannot retrieve Safe owners: ${(error as Error).message}`);
  }
}

/**
 * Submit unsigned proposal to Safe Transaction Service
 * @param proposal - Safe transaction proposal
 * @param chainId - Network chain ID
 * @param safeAddress - Safe wallet address
 * @param rpcUrl - RPC URL for network connection
 * @returns Safe transaction hash if successful, null otherwise
 */
async function submitUnsignedProposalToSafe(
  proposal: any,
  validationHash: string,
  chainId: number,
  safeAddress: string,
  rpcUrl: string
): Promise<string | null> {
  try {
    logger.info(
      '📤 Submitting unsigned proposal to Safe Transaction Service...',
      {
        chainId,
        safeAddress,
        to: proposal.to,
      }
    );

    // Initialize SafeApiKit with optional API key
    // API key is required for Safe Transaction Service submission
    // Get your API key at https://developer.safe.global
    const safeApiKey = process.env.SAFE_API_KEY;

    if (!safeApiKey) {
      logger.warn(
        '⚠️  SAFE_API_KEY not configured - Safe Transaction Service submission will fail',
        {
          hint: 'Get your API key at https://developer.safe.global',
        }
      );
      return null;
    }

    // Fetch Safe owners to use first owner as sender
    const owners = await getSafeOwners(safeAddress, rpcUrl);
    if (owners.length === 0) {
      throw new Error('Safe has no owners');
    }

    const senderAddress = owners[0]; // Use first owner as sender
    logger.info('Using Safe owner as sender for proposal submission', {
      senderAddress,
      totalOwners: owners.length,
    });

    const safeService = new SafeApiKit({
      chainId: BigInt(chainId),
      apiKey: safeApiKey,
    });

    // Fetch Safe's current nonce from the blockchain
    let safeNonce = 0;
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Minimal Safe contract ABI for nonce()
      const safeAbi = ['function nonce() external view returns (uint256)'];
      const safeContract = new ethers.Contract(safeAddress, safeAbi, provider);
      safeNonce = await safeContract.nonce();

      logger.info('Fetched Safe nonce from blockchain', {
        safeAddress,
        nonce: safeNonce.toString(),
      });
    } catch (error) {
      logger.warn('Failed to fetch Safe nonce, using 0', {
        error: (error as Error).message,
      });
      // Fallback to 0 if nonce fetch fails
      safeNonce = 0;
    }

    // Prepare transaction data
    const safeTransactionData = {
      to: proposal.to,
      value: proposal.value,
      data: proposal.data,
      operation: proposal.operation || 0,
      safeTxGas: proposal.safeTxGas || '0',
      baseGas: proposal.baseGas || '0',
      gasPrice: proposal.gasPrice || '0',
      gasToken:
        proposal.gasToken || '0x0000000000000000000000000000000000000000',
      refundReceiver:
        proposal.refundReceiver || '0x0000000000000000000000000000000000000000',
      nonce: safeNonce,
    };

    // Calculate proper Safe transaction hash using Safe Protocol Kit
    // Import Safe SDK to calculate EIP-712 compliant safeTxHash
    const Safe = (await import('@safe-global/protocol-kit')).default;
    const { EthersAdapter } = await import('@safe-global/protocol-kit');
    const { ethers } = await import('ethers');

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: provider,
    });

    const protocolKit = await Safe.create({
      ethAdapter,
      safeAddress,
    });

    // Create Safe transaction to get proper safeTxHash
    const safeTransaction = await protocolKit.createTransaction({
      transactions: [safeTransactionData],
    });

    const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);

    logger.info('Calculated EIP-712 compliant Safe transaction hash', {
      safeTxHash,
      previousValidationHash: validationHash,
    });

    // Generate pre-approved signature (contract signature format)
    // For unsigned transactions, use a special signature format that indicates
    // the transaction should be approved by the Safe owner
    const preApprovedSignature =
      '0x000000000000000000000000' +
      senderAddress.slice(2).toLowerCase() +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '01'; // signature type 1 = approved

    const proposePayload = {
      safeAddress: safeAddress,
      safeTransactionData,
      safeTxHash,
      senderAddress,
      senderSignature: preApprovedSignature,
    };

    // Log full request payload for debugging (truncate data for readability)
    logger.debug('Safe API proposeTransaction payload', {
      safeAddress: proposePayload.safeAddress,
      safeTxHash: proposePayload.safeTxHash,
      senderAddress: proposePayload.senderAddress,
      senderSignature: proposePayload.senderSignature,
      safeTransactionData: {
        to: safeTransactionData.to,
        value: safeTransactionData.value,
        dataLength: safeTransactionData.data?.length || 0,
        dataPreview: safeTransactionData.data?.substring(0, 66) + '...',
        operation: safeTransactionData.operation,
        safeTxGas: safeTransactionData.safeTxGas,
        baseGas: safeTransactionData.baseGas,
        gasPrice: safeTransactionData.gasPrice,
        gasToken: safeTransactionData.gasToken,
        refundReceiver: safeTransactionData.refundReceiver,
        nonce: safeTransactionData.nonce,
      },
    });

    const result = await safeService.proposeTransaction(proposePayload);

    const safeTxHash = result.safeTxHash || validationHash;
    logger.info('✅ Unsigned proposal submitted to Safe UI queue', {
      safeTxHash,
      chainId,
    });

    return safeTxHash;
  } catch (error) {
    // Enhanced error logging to capture full API error details
    const err = error as any;

    // Log detailed error information
    logger.error('❌ Safe API submission failed - Full error details:', err, {
      // HTTP response details (if available from axios or fetch)
      statusCode: err.response?.status || err.status,
      statusText: err.response?.statusText || err.statusText,
      responseData: err.response?.data || err.data,
      responseBody: err.response?.body,
      responseHeaders: err.response?.headers,
      // Request details
      requestUrl: err.config?.url || err.url,
      requestMethod: err.config?.method || err.method,
      requestHeaders: err.config?.headers,
      requestData:
        typeof err.config?.data === 'string'
          ? JSON.parse(err.config.data)
          : err.config?.data,
      // Safe API context
      chainId,
      safeAddress,
    });

    // Non-blocking: Safe API submission failure doesn't prevent deployment
    logger.warn(
      '⚠️  Failed to submit to Safe Transaction Service (non-blocking)',
      {
        error: err.message,
        chainId,
        safeAddress,
      }
    );
    logger.info(
      '💡 Manual creation in Safe UI is still possible using proposal file'
    );
    return null;
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
    slack: process.env.SLACK_WEBHOOK_URL
      ? {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
        }
      : { enabled: false },
    discord: process.env.DISCORD_WEBHOOK_URL
      ? {
          enabled: true,
          webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        }
      : { enabled: false },
  });

  try {
    logger.info('Starting Safe proposal creation', {
      deploymentId,
      projectRoot,
    });
    tracker.start(deploymentId, {
      workflow: process.env.GITHUB_WORKFLOW || 'local',
      runId: process.env.GITHUB_RUN_ID || 'local',
    });

    // Read deployment configuration (prioritize env vars over file)
    tracker.startPhase(
      deploymentId,
      'validation',
      'Reading deployment configuration'
    );

    let config: DeployConfig = {
      network: '',
      contract: '',
    };

    // Try to load from environment variables first (from GitHub Actions inputs)
    const envNetwork = process.env.NETWORK;
    const envContractName = process.env.CONTRACT_NAME;

    if (envNetwork && envContractName) {
      config.network = envNetwork;
      config.contract = envContractName;
      logger.debug(
        'Deployment configuration loaded from environment variables',
        {
          config,
        }
      );
    } else {
      // Fallback to .zerokey/deploy.yaml file if env vars not provided
      const configPath = resolve(projectRoot, '.zerokey', 'deploy.yaml');

      if (require('fs').existsSync(configPath)) {
        const configContent = readFileSync(configPath, 'utf-8');
        const fileConfig = yaml.load(configContent) as DeployConfig;

        // Use file values for missing env vars
        config.network = envNetwork || fileConfig.network;
        config.contract = envContractName || fileConfig.contract;

        logger.debug('Deployment configuration loaded from file', {
          config,
          configPath,
        });
      } else if (!envNetwork || !envContractName) {
        // Neither env vars nor file provided - error
        throw new ConfigurationError(
          'Deployment configuration not found. Provide either:\n' +
            '  1. GitHub Actions inputs (network, contract-name), or\n' +
            '  2. .zerokey/deploy.yaml file',
          {
            configKey: 'deployConfig',
            expectedFormat:
              'Environment variables (NETWORK, CONTRACT_NAME) or YAML file at .zerokey/deploy.yaml',
            context: {
              configPath,
              envNetwork,
              envContractName,
            },
          }
        );
      }
    }

    // Final validation - ensure we have both required fields
    if (!config.network || !config.contract) {
      throw new ConfigurationError(
        'Missing required deployment configuration',
        {
          configKey: 'deployConfig',
          expectedFormat: 'Both network and contract must be specified',
          context: { config },
        }
      );
    }

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
      'polygon-amoy': 80002,
      arbitrum: 42161,
      'arbitrum-sepolia': 421614,
      optimism: 10,
      'optimism-sepolia': 11155420,
      base: 8453,
      'base-sepolia': 84532,
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
      projectRoot,
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

    // Perform gas analysis
    tracker.startPhase(
      deploymentId,
      'gas_analysis',
      'Analyzing deployment gas costs'
    );

    let gasAnalysisReport;
    try {
      logger.info('Starting gas analysis', {
        network: config.network,
        bytecode: artifact.bytecode.substring(0, 10) + '...',
      });

      const gasFetcher = new GasPriceFetcher();
      const gasEstimator = new GasEstimator();
      const reporter = new OptimizationReporter(gasFetcher, gasEstimator);

      // Generate comprehensive optimization report
      gasAnalysisReport = await reporter.generateReport(artifact.bytecode, {
        network: config.network as SupportedNetwork,
        constructorArgs: config.constructorArgs,
        compareNetworks: [
          'sepolia',
          'mainnet',
          'polygon',
          'arbitrum',
          'optimism',
          'base',
        ].filter((n) => n !== config.network) as SupportedNetwork[],
      });

      logger.info('Gas analysis completed', {
        estimatedGas: gasAnalysisReport.estimate.deploymentGas,
        estimatedCost: gasAnalysisReport.estimate.costInUSD,
        recommendations: gasAnalysisReport.recommendations.length,
        optimizationScore: gasAnalysisReport.optimizationScore,
      });

      // Check cost thresholds
      const costThreshold = process.env.GAS_COST_THRESHOLD
        ? parseFloat(process.env.GAS_COST_THRESHOLD)
        : config.network === 'mainnet'
          ? 100
          : 10;

      const estimatedCost = parseFloat(
        gasAnalysisReport.estimate.costInUSD || '0'
      );
      if (estimatedCost > costThreshold) {
        logger.warn('⚠️  Deployment cost exceeds threshold', {
          estimatedCost: `$${estimatedCost}`,
          threshold: `$${costThreshold}`,
          network: config.network,
        });
      }

      tracker.completePhase(
        deploymentId,
        'gas_analysis',
        `Gas analysis completed: $${estimatedCost}`
      );
    } catch (error) {
      logger.warn('Gas analysis failed, continuing deployment', {
        error: (error as Error).message,
      });
      tracker.completePhase(
        deploymentId,
        'gas_analysis',
        'Gas analysis failed (non-blocking)'
      );
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
    let proposal: any;
    let deploymentAddress: string;
    const salt = '0x' + '0'.repeat(64); // Default salt for CREATE2

    if (config.proxy) {
      // Proxy deployment or upgrade
      if (config.proxy.proxyAddress) {
        // This is an upgrade
        logger.info('Creating Safe upgrade proposal', {
          network: config.network,
          chainId,
          contract: config.contract,
          proxyAddress: config.proxy.proxyAddress,
          proxyType: config.proxy.type,
        });

        // Calculate implementation address
        const implementationAddress = builder.calculateDeploymentAddress(
          artifact.bytecode,
          salt
        );

        // Create batch proposal: deploy new implementation + upgrade proxy
        const transactions = [];

        // 1. Deploy new implementation
        const implementationDeployment = await builder.createDeploymentProposal(
          {
            contractName: config.contract,
            bytecode: artifact.bytecode,
            constructorArgs: config.constructorArgs || [],
            value: '0',
            metadata: {
              pr: process.env.GITHUB_PR_NUMBER || 'local',
              commit: process.env.GITHUB_SHA || 'local',
              deployer: process.env.GITHUB_ACTOR || 'local',
              author: process.env.GITHUB_PR_AUTHOR || 'local',
              timestamp: Date.now(),
              network: config.network,
            },
          }
        );
        transactions.push(implementationDeployment);

        // 2. Upgrade proxy to new implementation
        if (config.proxy.type === 'uups') {
          // For UUPS, call upgradeTo or upgradeToAndCall on the proxy
          const upgradeProposal = await builder.createUpgradeProposal({
            proxyAddress: config.proxy.proxyAddress,
            newImplementation: implementationAddress,
            functionSelector: config.proxy.initializeArgs
              ? 'upgradeToAndCall(address,bytes)'
              : 'upgradeTo(address)',
            upgradeArgs: config.proxy.initializeArgs
              ? [
                  new utils.Interface([
                    'function initialize(' +
                      config.proxy.initializeArgs
                        .map(() => 'address')
                        .join(',') +
                      ')',
                  ]).encodeFunctionData(
                    'initialize',
                    config.proxy.initializeArgs
                  ),
                ]
              : [],
          });
          transactions.push(upgradeProposal);
        } else {
          throw new ValidationError(
            'Transparent proxy upgrades not yet supported',
            {
              field: 'proxy.type',
              value: config.proxy.type,
            }
          );
        }

        proposal = builder.createBatchProposal(transactions);
        deploymentAddress = config.proxy.proxyAddress; // Proxy address stays the same
      } else {
        // This is a new proxy deployment
        logger.info('Creating Safe proxy deployment proposal', {
          network: config.network,
          chainId,
          contract: config.contract,
          proxyType: config.proxy.type,
        });

        // Calculate implementation address
        const implementationAddress = builder.calculateDeploymentAddress(
          artifact.bytecode,
          salt
        );

        const transactions = [];

        // 1. Deploy implementation
        const implementationDeployment = await builder.createDeploymentProposal(
          {
            contractName: config.contract,
            bytecode: artifact.bytecode,
            constructorArgs: config.constructorArgs || [],
            value: '0',
            metadata: {
              pr: process.env.GITHUB_PR_NUMBER || 'local',
              commit: process.env.GITHUB_SHA || 'local',
              deployer: process.env.GITHUB_ACTOR || 'local',
              author: process.env.GITHUB_PR_AUTHOR || 'local',
              timestamp: Date.now(),
              network: config.network,
            },
          }
        );
        transactions.push(implementationDeployment);

        // 2. Deploy proxy
        // Load proxy artifacts
        const proxyArtifactName =
          config.proxy.type === 'uups'
            ? 'ERC1967Proxy'
            : 'TransparentUpgradeableProxy';
        const proxyArtifactPath = resolve(
          projectRoot,
          'artifacts',
          'contracts',
          'proxies',
          `${proxyArtifactName}.sol`,
          `${proxyArtifactName}.json`
        );

        if (!require('fs').existsSync(proxyArtifactPath)) {
          throw new ConfigurationError(`Proxy artifact not found`, {
            configKey: 'proxyArtifact',
            expectedFormat: 'OpenZeppelin proxy contract artifact',
            context: { proxyArtifactPath, proxyType: config.proxy.type },
          });
        }

        const proxyArtifact = JSON.parse(
          readFileSync(proxyArtifactPath, 'utf-8')
        );

        // Encode initialize call data
        let initializeData = '0x';
        if (
          config.proxy.initializeArgs &&
          config.proxy.initializeArgs.length > 0
        ) {
          // Assume initialize function signature - this should match the implementation contract
          const initInterface = new utils.Interface([
            'function initialize(' +
              config.proxy.initializeArgs.map(() => 'address').join(',') +
              ')',
          ]);
          initializeData = initInterface.encodeFunctionData(
            'initialize',
            config.proxy.initializeArgs
          );
        }

        // Encode proxy constructor args
        const proxyConstructorArgs =
          config.proxy.type === 'uups'
            ? [implementationAddress, initializeData]
            : [
                implementationAddress,
                config.proxy.admin || safeAddress, // Default admin to Safe
                initializeData,
              ];

        const proxyDeployment = await builder.createDeploymentProposal({
          contractName: proxyArtifactName,
          bytecode: proxyArtifact.bytecode,
          constructorArgs: proxyConstructorArgs,
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
        transactions.push(proxyDeployment);

        proposal = builder.createBatchProposal(transactions);

        // For proxy deployments, the deployment address is the proxy address
        const proxySalt = '0x' + '1'.repeat(64); // Different salt for proxy
        deploymentAddress = builder.calculateDeploymentAddress(
          proxyArtifact.bytecode,
          proxySalt
        );
      }
    } else {
      // Regular deployment (no proxy)
      logger.info('Creating Safe deployment proposal', {
        network: config.network,
        chainId,
        contract: config.contract,
        safeAddress,
      });

      proposal = await builder.createDeploymentProposal({
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

      logger.debug('Proposal created', {
        proposalHash: proposal.validationHash,
      });

      // Validate the proposal
      if (!builder.validateProposal(proposal)) {
        throw new ValidationError('Generated proposal failed validation', {
          field: 'proposal',
          value: proposal,
        });
      }

      logger.debug('Proposal validated successfully');

      // Calculate deployment address (for logging)
      deploymentAddress = builder.calculateDeploymentAddress(
        artifact.bytecode,
        salt
      );
    }

    logger.info('Deployment address calculated', { deploymentAddress });

    // Serialize proposal
    const serialized = builder.serializeProposal(proposal);
    const parsed = JSON.parse(serialized);

    // Log detailed proposal structure for debugging
    logger.debug('Serialized proposal structure (for Safe API submission)', {
      to: parsed.proposal.to,
      value: parsed.proposal.value,
      data: parsed.proposal.data?.substring(0, 100) + '...',
      operation: parsed.proposal.operation,
      safeTxGas: parsed.proposal.safeTxGas,
      baseGas: parsed.proposal.baseGas,
      gasPrice: parsed.proposal.gasPrice,
      gasToken: parsed.proposal.gasToken,
      refundReceiver: parsed.proposal.refundReceiver,
      nonce: parsed.proposal.nonce,
      validationHash: parsed.validationHash,
    });

    // Try to submit to Safe Transaction Service if SAFE_API_KEY is configured
    let safeTxHashFromApi: string | null = null;

    const rpcUrl = process.env.RPC_URL;
    if (process.env.SAFE_API_KEY && rpcUrl) {
      logger.info(
        'Attempting to submit proposal to Safe Transaction Service...'
      );
      safeTxHashFromApi = await submitUnsignedProposalToSafe(
        parsed.proposal,
        parsed.validationHash,
        chainId,
        safeAddress,
        rpcUrl
      );
    } else {
      logger.info('📋 Manual workflow - Safe API submission skipped', {
        reason: 'SAFE_API_KEY or RPC_URL not configured',
        artifactFile: 'safe-proposal.json',
        nextSteps:
          'Safe owners will review and sign the proposal in Safe UI Queue',
      });
    }

    // Add additional metadata for CI
    const enrichedProposal = {
      ...parsed,
      safeTxHash: safeTxHashFromApi || null,
      submissionStatus: safeTxHashFromApi ? 'queued' : 'manual',
      deployment: {
        expectedAddress: deploymentAddress,
        network: config.network,
        chainId,
        contract: config.contract,
        constructorArgs: config.constructorArgs || [],
        value: config.value || '0',
        proxy: config.proxy, // Include proxy configuration for OPA validation
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
                  cheapest:
                    gasAnalysisReport.networkComparison.cheapest.network,
                  savings: gasAnalysisReport.networkComparison.savings,
                }
              : undefined,
          }
        : undefined,
    };

    // Write proposal to file
    const outputPath = resolve(projectRoot, 'safe-proposal.json');
    writeFileSync(outputPath, JSON.stringify(enrichedProposal, null, 2));

    if (safeTxHashFromApi) {
      logger.info('✨ Transaction available in Safe UI queue for signing', {
        safeTxHash: safeTxHashFromApi,
      });
    } else {
      logger.info(
        '📝 Use proposal file to manually create transaction in Safe UI',
        {
          proposalFile: outputPath,
        }
      );
    }

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

    // Post gas analysis to GitHub PR comment
    if (
      gasAnalysisReport &&
      process.env.GITHUB_TOKEN &&
      process.env.GITHUB_PR_NUMBER
    ) {
      try {
        logger.info('Posting gas analysis to PR comment');

        const reporter = new OptimizationReporter(
          new GasPriceFetcher(),
          new GasEstimator()
        );
        const reportMarkdown = reporter.formatReport(gasAnalysisReport, 'ci');

        // Use GitHub CLI to post comment
        const { execSync } = require('child_process');
        const commentBody = `## ⛽ Gas Optimization Report

${reportMarkdown}

---
*Gas analysis provided by ZeroKey CI*`;

        execSync(
          `gh pr comment ${process.env.GITHUB_PR_NUMBER} --body "${commentBody.replace(/"/g, '\\"')}"`,
          {
            encoding: 'utf-8',
            env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
          }
        );

        logger.info('Gas analysis posted to PR comment successfully');
      } catch (error) {
        logger.warn('Failed to post gas analysis to PR', {
          error: (error as Error).message,
        });
      }
    }

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
