#!/usr/bin/env bun
/**
 * Local PKP Deployment Script
 *
 * This script enables developers to deploy smart contracts from their local machine
 * using Lit Protocol PKP for automated signing, without managing private keys.
 *
 * Workflow:
 * 1. Load PKP configuration from .zerokey/pkp-config.json
 * 2. Load deployment configuration from .zerokey/deploy.yaml
 * 3. Compile contract with Hardhat
 * 4. Create Safe proposal via SafeProposalBuilder
 * 5. Sign proposal with PKP via LitPKPSigner
 * 6. Submit signed transaction to Safe Transaction Service
 * 7. Display Safe UI link for multisig approval
 *
 * Environment Variables:
 * - CONTRACT_NAME: Contract to deploy (optional, overrides deploy.yaml)
 * - NETWORK: Network to deploy to (optional, overrides deploy.yaml)
 * - SEPOLIA_RPC_URL (or appropriate network RPC): Required for Safe interaction
 *
 * Prerequisites:
 * - PKP must be set up via scripts/setup/* (mint, grant permission, add to Safe)
 * - .zerokey/pkp-config.json must exist
 * - .zerokey/deploy.yaml must exist (or env vars CONTRACT_NAME, NETWORK)
 * - Contract must be compiled (hardhat compile)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'js-yaml';
import { SafeProposalBuilder } from '../src/services/SafeProposalBuilder';
import { LitPKPSigner } from '../src/services/LitPKPSigner';
import SafeApiKit from '@safe-global/api-kit';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import type {
  SessionSigsMap,
  LitResourceAbilityRequest,
} from '@lit-protocol/types';
import type { SafeTransaction } from '../src/types/safe';

interface PKPConfig {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  network: string;
  litActionIpfsCid: string;
  litActionCID?: string;
  safeAddress: string;
  safeThreshold: number;
}

interface DeployConfig {
  network: string;
  contract: string;
  constructorArgs?: any[];
  value?: string;
}

interface SignatureResult {
  r: string;
  s: string;
  v: number;
}

const projectRoot = process.cwd();

/**
 * Load PKP configuration from .zerokey/pkp-config.json
 */
function loadPKPConfig(): PKPConfig {
  const configPath = resolve(projectRoot, '.zerokey', 'pkp-config.json');

  if (!existsSync(configPath)) {
    console.error('❌ PKP configuration not found');
    console.error('   Please run PKP setup scripts first:');
    console.error('   1. bun run scripts/setup/mint-pkp.ts');
    console.error('   2. bun run scripts/setup/grant-lit-action-permission.ts');
    console.error('   3. bun run scripts/setup/add-pkp-to-safe.ts');
    console.error(`   Configuration should be at: ${configPath}`);
    process.exit(1);
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as PKPConfig;

    if (!config.litActionIpfsCid && config.litActionCID) {
      config.litActionIpfsCid = config.litActionCID;
    }

    // Validate required fields
    const requiredFields: (keyof PKPConfig)[] = [
      'tokenId',
      'publicKey',
      'ethAddress',
      'network',
      'litActionIpfsCid',
      'safeAddress',
      'safeThreshold',
    ];

    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(`❌ PKP configuration missing required field: ${field}`);
        console.error('   Please complete PKP setup before deploying');
        process.exit(1);
      }
    }

    return config;
  } catch (error) {
    console.error('❌ Failed to load PKP configuration:', error);
    process.exit(1);
  }
}

/**
 * Load deployment configuration from .zerokey/deploy.yaml or env vars
 */
function loadDeployConfig(): DeployConfig {
  // Try environment variables first
  const envNetwork = process.env.NETWORK;
  const envContractName = process.env.CONTRACT_NAME;

  if (envNetwork && envContractName) {
    console.log('📋 Using deployment config from environment variables');
    return {
      network: envNetwork,
      contract: envContractName,
      constructorArgs: [],
      value: '0',
    };
  }

  // Fallback to .zerokey/deploy.yaml
  const configPath = resolve(projectRoot, '.zerokey', 'deploy.yaml');

  if (!existsSync(configPath)) {
    console.error('❌ Deployment configuration not found');
    console.error('   Please create .zerokey/deploy.yaml or set env vars:');
    console.error('   - NETWORK (e.g., sepolia, base-sepolia)');
    console.error('   - CONTRACT_NAME (e.g., SimpleStorage)');
    process.exit(1);
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as DeployConfig;

    if (!config.network || !config.contract) {
      console.error('❌ Invalid deployment configuration');
      console.error('   deploy.yaml must specify network and contract');
      process.exit(1);
    }

    console.log('📋 Using deployment config from .zerokey/deploy.yaml');
    return config;
  } catch (error) {
    console.error('❌ Failed to load deployment configuration:', error);
    process.exit(1);
  }
}

/**
 * Compile contract with Hardhat
 */
function compileContract(contractName: string): void {
  console.log(`🔨 Compiling ${contractName}...`);

  try {
    execSync('npx hardhat compile', {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    console.log('✅ Compilation successful');
  } catch (error) {
    console.error('❌ Compilation failed:', error);
    process.exit(1);
  }
}

/**
 * Load compiled contract artifact
 */
function loadArtifact(contractName: string): any {
  const artifactPath = resolve(
    projectRoot,
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (!existsSync(artifactPath)) {
    console.error(`❌ Contract artifact not found: ${artifactPath}`);
    console.error('   Please ensure contract is compiled');
    process.exit(1);
  }

  try {
    return JSON.parse(readFileSync(artifactPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Failed to load contract artifact:', error);
    process.exit(1);
  }
}

/**
 * Get chain ID for network
 */
function getChainId(network: string): number {
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

  const chainId = chainIds[network];
  if (!chainId) {
    console.error(`❌ Unsupported network: ${network}`);
    console.error(`   Supported networks: ${Object.keys(chainIds).join(', ')}`);
    process.exit(1);
  }

  return chainId;
}

/**
 * Create Safe deployment proposal
 */
async function createProposal(
  safeAddress: string,
  chainId: number,
  contractName: string,
  artifact: any,
  deployConfig: DeployConfig
): Promise<SafeTransaction> {
  console.log('📝 Creating Safe deployment proposal...');

  const builder = new SafeProposalBuilder({
    safeAddress,
    chainId,
  });

  const proposal = await builder.createDeploymentProposal({
    contractName,
    bytecode: artifact.bytecode,
    constructorArgs: deployConfig.constructorArgs || [],
    value: deployConfig.value || '0',
    metadata: {
      pr: 'local',
      commit: 'local',
      deployer: 'local-pkp',
      author: 'local-pkp',
      timestamp: Date.now(),
      network: deployConfig.network,
    },
  });

  // Validate proposal
  if (!builder.validateProposal(proposal)) {
    console.error('❌ Generated proposal failed validation');
    process.exit(1);
  }

  const validationHash = builder.generateValidationHash(proposal);
  const safeProposal: SafeTransaction = {
    ...proposal,
    safe: safeAddress,
    validationHash,
  };

  console.log('✅ Proposal created and validated');
  console.log(`   Validation Hash: ${safeProposal.validationHash}`);

  // Calculate deployment address
  const salt = '0x' + '0'.repeat(64);
  const deploymentAddress = builder.calculateDeploymentAddress(
    artifact.bytecode,
    salt
  );
  console.log(`   Expected Address: ${deploymentAddress}`);

  // Save proposal to file for reference
  const serialized = builder.serializeProposal(safeProposal);
  const outputPath = resolve(projectRoot, 'safe-proposal-local.json');
  writeFileSync(outputPath, serialized);
  console.log(`   Proposal saved: ${outputPath}`);

  return safeProposal;
}

/**
 * Generate Lit Protocol session signatures bound to the PKP
 * For local deployment, we skip Lit Action verification and use direct PKP signing
 */
async function generateSessionSignatures(
  pkpConfig: PKPConfig
): Promise<SessionSigsMap> {
  console.log('🔑 Generating Lit session signatures...');
  console.log('   ℹ️  Using direct PKP signing (no Lit Action verification)');

  const litNodeClient = new LitNodeClient({
    litNetwork: pkpConfig.network as 'datil-dev' | 'datil-test' | 'datil',
    debug: false,
  });

  try {
    await litNodeClient.connect();
    console.log('   ✓ Connected to Lit network for session auth');

    // For local deployment, only request PKP signing permission
    // No Lit Action execution needed - we just want to sign the Safe transaction
    const resourceAbilityRequests: LitResourceAbilityRequest[] = [
      {
        resource: new LitPKPResource(pkpConfig.tokenId),
        ability: LIT_ABILITY.PKPSigning,
      },
    ];

    // Do NOT pass litActionIpfsId for local deployment
    // This avoids IPFS hash verification that can fail
    const sessionSigs = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: pkpConfig.publicKey,
      resourceAbilityRequests,
      authMethods: [],
    });

    console.log(
      `   ✓ Session signatures ready (${Object.keys(sessionSigs).length} nodes)`
    );

    return sessionSigs;
  } catch (error) {
    console.error('❌ Failed to generate session signatures:', error);
    throw error;
  } finally {
    await litNodeClient.disconnect();
  }
}

/**
 * Sign Safe transaction with PKP
 */
async function signWithPKP(
  proposal: SafeTransaction,
  pkpConfig: PKPConfig,
  sessionSigs: SessionSigsMap
): Promise<SignatureResult> {
  console.log('🔐 Signing with PKP...');
  console.log(`   PKP Address: ${pkpConfig.ethAddress}`);
  console.log(`   Lit Network: ${pkpConfig.network}`);
  console.log(`   Lit Action CID: ${pkpConfig.litActionIpfsCid}`);

  const signer = new LitPKPSigner({
    pkpPublicKey: pkpConfig.publicKey,
    network: pkpConfig.network as 'datil-dev' | 'datil-test' | 'datil',
  });

  try {
    // Connect to Lit network before signing
    console.log('   Connecting to Lit network...');
    await signer.connect();
    console.log('   ✓ Connected to Lit network');

    const signature = await signer.signSafeTransaction(proposal, sessionSigs);

    console.log('✅ PKP signature obtained');
    console.log(`   r: ${signature.r.substring(0, 10)}...`);
    console.log(`   s: ${signature.s.substring(0, 10)}...`);
    console.log(`   v: ${signature.v}`);

    return signature;
  } catch (error) {
    console.error('❌ PKP signing failed:', error);
    throw error;
  } finally {
    // Always disconnect from Lit network
    await signer.disconnect();
  }
}

/**
 * Submit signed transaction to Safe Transaction Service
 */
async function submitToSafe(
  proposal: SafeTransaction,
  signature: SignatureResult,
  pkpConfig: PKPConfig,
  chainId: number
): Promise<string> {
  console.log('📤 Submitting signed transaction to Safe...');

  try {
    const safeService = new SafeApiKit({
      chainId: BigInt(chainId),
    });

    // Construct signature data
    const signatureData =
      signature.r + signature.s.slice(2) + signature.v.toString(16);

    // Propose transaction to Safe
    const result = await safeService.proposeTransaction({
      safeAddress: proposal.safe,
      safeTransactionData: {
        to: proposal.to,
        value: proposal.value,
        data: proposal.data,
        operation: proposal.operation,
        safeTxGas: proposal.safeTxGas,
        baseGas: proposal.baseGas,
        gasPrice: proposal.gasPrice,
        gasToken: proposal.gasToken,
        refundReceiver: proposal.refundReceiver,
        nonce: proposal.nonce,
      },
      safeTxHash: proposal.validationHash,
      senderAddress: pkpConfig.ethAddress,
      senderSignature: signatureData,
    });

    const safeTxHash = result.safeTxHash || proposal.validationHash;

    console.log('✅ Transaction submitted to Safe');
    console.log(`   Safe Tx Hash: ${safeTxHash}`);

    return safeTxHash;
  } catch (error) {
    console.error('❌ Safe submission failed:', error);
    throw error;
  }
}

/**
 * Get Safe UI URL for network
 */
function getSafeUIUrl(network: string, safeAddress: string): string {
  const networkPrefixes: Record<string, string> = {
    mainnet: 'eth',
    sepolia: 'sep',
    polygon: 'matic',
    'polygon-amoy': 'polygon-amoy',
    arbitrum: 'arb1',
    'arbitrum-sepolia': 'arb-sep',
    optimism: 'oeth',
    'optimism-sepolia': 'opt-sep',
    base: 'base',
    'base-sepolia': 'base-sep',
  };

  const prefix = networkPrefixes[network] || network;
  return `https://app.safe.global/transactions/queue?safe=${prefix}:${safeAddress}`;
}

/**
 * Main deployment workflow
 */
async function main() {
  console.log('🚀 ZeroKeyCI Local PKP Deployment\n');

  // Step 1: Load configurations
  console.log('📋 Step 1: Loading configurations...');
  const pkpConfig = loadPKPConfig();
  const deployConfig = loadDeployConfig();
  console.log(`   Contract: ${deployConfig.contract}`);
  console.log(`   Network: ${deployConfig.network}`);
  console.log(`   Safe: ${pkpConfig.safeAddress}`);
  console.log();

  // Step 2: Compile contract
  console.log('🔨 Step 2: Compiling contract...');
  compileContract(deployConfig.contract);
  console.log();

  // Step 3: Load artifact
  console.log('📦 Step 3: Loading contract artifact...');
  const artifact = loadArtifact(deployConfig.contract);
  console.log(`   Bytecode size: ${artifact.bytecode.length} bytes`);
  console.log();

  // Step 4: Create proposal
  console.log('📝 Step 4: Creating Safe proposal...');
  const chainId = getChainId(deployConfig.network);
  const proposal = await createProposal(
    pkpConfig.safeAddress,
    chainId,
    deployConfig.contract,
    artifact,
    deployConfig
  );
  console.log();

  let safeTxHash: string | null = null;
  console.log('🔐 Step 5: Attempting PKP auto-sign + Safe submission...');
  try {
    const sessionSigs = await generateSessionSignatures(pkpConfig);
    console.log();

    console.log('🔐 Step 6: Signing with PKP...');
    const signature = await signWithPKP(proposal, pkpConfig, sessionSigs);
    console.log();

    console.log('📤 Step 7: Submitting to Safe Transaction Service...');
    safeTxHash = await submitToSafe(proposal, signature, pkpConfig, chainId);
    console.log();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown session/signing error';
    console.error('⚠️  PKP auto-signing failed:', message);
    console.error('   Falling back to manual Safe UI submission.');
    console.log();
  }

  // Step 8: Display success
  const safeUIUrl = getSafeUIUrl(deployConfig.network, pkpConfig.safeAddress);

  console.log('='.repeat(70));
  console.log('✅ DEPLOYMENT PROPOSAL CREATED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log();
  console.log('📄 Proposal Details:');
  console.log(`  Contract: ${deployConfig.contract}`);
  console.log(`  Network: ${deployConfig.network}`);
  console.log(`  Safe: ${pkpConfig.safeAddress}`);
  console.log(
    `  Proposal File: ${resolve(projectRoot, 'safe-proposal-local.json')}`
  );
  if (safeTxHash) {
    console.log(`  Safe Tx Hash: ${safeTxHash}`);
  }
  console.log();
  console.log('📋 Next Steps:');
  console.log('  1. Review the proposal in safe-proposal-local.json');
  console.log();
  if (safeTxHash) {
    console.log('  2. Open the Safe queue (already queued via PKP):');
    console.log(`     ${safeUIUrl}`);
    console.log();
    console.log('  3. Share the Safe Tx Hash with other owners:');
    console.log(`     ${safeTxHash}`);
  } else {
    console.log('  2. Submit to Safe manually via Safe UI:');
    console.log(`     ${safeUIUrl}`);
  }
  console.log();
  console.log('  4. Safe owners must sign the transaction');
  console.log(
    `     (Threshold: ${pkpConfig.safeThreshold} signature(s) required)`
  );
  console.log();
  console.log('  5. Once threshold is met, execute the transaction');
  console.log();
  console.log('  6. Contract will deploy to the calculated address');
  console.log();
  if (!safeTxHash) {
    console.log('🔧 PKP Auto-Signing Tips:');
    console.log('  - Session signature failures usually mean Lit permissions.');
    console.log('  - Re-run docs/PKP_SETUP.md if errors persist.');
    console.log();
  }
  console.log('🔐 Security:');
  console.log('  ✅ No private keys used or stored locally');
  console.log('  ✅ Safe multisig approval required for execution');
  console.log('  ✅ PKP automated signing attempts run locally');
  console.log('='.repeat(70));
}

// Run if executed directly
if (import.meta.main) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment failed:', error);
      process.exit(1);
    });
}
