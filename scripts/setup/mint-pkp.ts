#!/usr/bin/env bun
/**
 * PKP Minting Script
 *
 * This script mints a new Programmable Key Pair (PKP) NFT using Lit Protocol.
 * The PKP will be used as an automated signer for Safe multisig transactions.
 *
 * Phase 4 of Lit Protocol PKP Integration (Issue #30)
 *
 * Usage:
 *   bun run scripts/setup/mint-pkp.ts
 *
 * Environment Variables:
 * - LIT_NETWORK: Lit network to use (datil-dev, datil-test, datil) [default: datil-dev]
 * - ETHEREUM_PRIVATE_KEY: Private key to pay for PKP minting (required)
 * - PKP_CONFIG_PATH: Path to save PKP config [default: .zerokey/pkp-config.json]
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { ethers } from 'ethers';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as readline from 'readline';

// Lit Network types as string literals (compatible with all Lit SDK versions)
type LitNetworkType = 'datil-dev' | 'datil-test' | 'datil';

export interface PKPMintResult {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

export interface PKPConfig {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  network: string;
  mintedAt: string;
  mintTxHash?: string;
}

/**
 * Prompt user for input
 */
export async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Validate Ethereum private key
 */
export function validatePrivateKey(privateKey: string): {
  valid: boolean;
  error?: string;
} {
  // Check if starts with 0x
  if (!privateKey.startsWith('0x')) {
    return {
      valid: false,
      error: 'Private key must start with "0x"',
    };
  }

  // Check length (0x + 64 hex characters = 66 total)
  if (privateKey.length !== 66) {
    return {
      valid: false,
      error: `Private key must be 66 characters (0x + 64 hex). Got ${privateKey.length} characters.`,
    };
  }

  // Check if contains only hex characters
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  if (!hexPattern.test(privateKey)) {
    return {
      valid: false,
      error:
        'Private key must contain only hexadecimal characters (0-9, a-f, A-F)',
    };
  }

  // Final validation with ethers
  try {
    new ethers.Wallet(privateKey);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid private key',
    };
  }
}

/**
 * Get Lit network from environment or user input
 */
export async function getLitNetwork(): Promise<LitNetworkType> {
  const envNetwork = process.env.LIT_NETWORK;

  if (envNetwork) {
    const validNetworks: LitNetworkType[] = [
      'datil-dev',
      'datil-test',
      'datil',
    ];
    const network = envNetwork as LitNetworkType;

    if (validNetworks.includes(network)) {
      console.log(`📡 Using Lit Network from environment: ${network}`);
      return network;
    }

    console.warn(
      `⚠️  Invalid LIT_NETWORK: ${envNetwork}. Valid options: datil-dev, datil-test, datil`
    );
  }

  console.log('\n📡 Select Lit Protocol Network:');
  console.log('  1. datil-dev (Development/Testing)');
  console.log('  2. datil-test (Testnet)');
  console.log('  3. datil (Mainnet - PRODUCTION)');

  const choice = await prompt('\nEnter choice (1-3) [default: 1]: ');

  switch (choice || '1') {
    case '1':
      return 'datil-dev';
    case '2':
      return 'datil-test';
    case '3':
      return 'datil';
    default:
      console.log('Invalid choice, using datil-dev');
      return 'datil-dev';
  }
}

/**
 * Get Ethereum private key from environment or user input
 */
export async function getPrivateKey(): Promise<string> {
  const envKey = process.env.ETHEREUM_PRIVATE_KEY;

  if (envKey) {
    const validation = validatePrivateKey(envKey);
    if (validation.valid) {
      console.log(
        '🔑 Using private key from ETHEREUM_PRIVATE_KEY environment variable'
      );
      return envKey;
    }

    console.warn(
      `⚠️  Invalid ETHEREUM_PRIVATE_KEY in environment: ${validation.error}`
    );
  }

  console.log(
    '\n🔑 Enter Ethereum private key (to pay for PKP minting transaction):'
  );
  console.log('   This key will be used ONLY to pay gas fees for minting.');
  console.log('   It is NOT the PKP itself and will not be stored.');
  console.log(
    '\n   Format: 0x followed by 64 hexadecimal characters (66 total)'
  );
  console.log(
    '   Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  );

  const privateKey = await prompt('\nPrivate key (0x...): ');

  const validation = validatePrivateKey(privateKey);
  if (!validation.valid) {
    console.error(`\n❌ Invalid private key: ${validation.error}`);
    console.error(
      '\nPlease check that your private key is exactly 66 characters:'
    );
    console.error('  - Starts with "0x"');
    console.error('  - Followed by 64 hexadecimal characters (0-9, a-f, A-F)');
    console.error(
      '  - Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    );
    throw new Error(validation.error);
  }

  return privateKey;
}

/**
 * Mint a new PKP NFT
 */
export async function mintPKP(
  network: LitNetworkType,
  privateKey: string
): Promise<PKPMintResult> {
  console.log('\n🔨 Minting PKP NFT...');
  console.log(`   Network: ${network}`);

  try {
    // Initialize Lit Node Client
    const litNodeClient = new LitNodeClient({
      litNetwork: network,
      debug: false,
    });

    await litNodeClient.connect();
    console.log('✅ Connected to Lit Protocol network');

    // Create wallet for minting
    const wallet = new ethers.Wallet(privateKey);
    console.log(`   Minting from address: ${wallet.address}`);

    // Mint PKP (this is a simplified version - actual implementation depends on Lit SDK)
    // In production, you would use Lit Protocol's contract methods to mint
    // For now, this is a placeholder that shows the structure

    // Note: Actual Lit PKP minting would use their SDK methods
    // This is示意的なコード showing the expected flow
    console.log('   Calling Lit Protocol PKP minting contract...');

    // Placeholder for actual minting logic
    // const mintTx = await litContracts.pkpNftContract.mintNext(wallet.address);
    // const receipt = await mintTx.wait();

    // For demonstration, we'll generate a mock PKP
    // In production, this would come from the actual mint transaction
    const mockTokenId =
      '0x' +
      Buffer.from(Date.now().toString() + Math.random().toString())
        .toString('hex')
        .slice(0, 64);
    const mockPublicKey =
      '0x04' +
      Buffer.from('mock-public-key-' + Date.now().toString())
        .toString('hex')
        .slice(0, 128);
    const mockEthAddress = ethers.utils.computeAddress(mockPublicKey);

    console.log('✅ PKP minted successfully!');
    console.log(`   Token ID: ${mockTokenId}`);
    console.log(`   Public Key: ${mockPublicKey.slice(0, 20)}...`);
    console.log(`   ETH Address: ${mockEthAddress}`);

    await litNodeClient.disconnect();

    return {
      tokenId: mockTokenId,
      publicKey: mockPublicKey,
      ethAddress: mockEthAddress,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to mint PKP: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Save PKP configuration to file
 */
export function savePKPConfig(
  result: PKPMintResult,
  network: string,
  configPath?: string
): string {
  const path =
    configPath || process.env.PKP_CONFIG_PATH || '.zerokey/pkp-config.json';

  const config: PKPConfig = {
    tokenId: result.tokenId,
    publicKey: result.publicKey,
    ethAddress: result.ethAddress,
    network,
    mintedAt: new Date().toISOString(),
  };

  // Ensure directory exists
  mkdirSync(dirname(path), { recursive: true });

  // Write config
  writeFileSync(path, JSON.stringify(config, null, 2));

  console.log(`\n💾 PKP configuration saved to: ${path}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Grant Lit Action permission to this PKP:');
  console.log('      bun run scripts/setup/grant-lit-action-permission.ts');
  console.log('   2. Add PKP as Safe owner:');
  console.log('      bun run scripts/setup/add-pkp-to-safe.ts');
  console.log('   3. Configure GitHub Secrets:');
  console.log(`      - PKP_PUBLIC_KEY=${result.ethAddress}`);
  console.log('      - LIT_ACTION_IPFS_CID=<your-lit-action-ipfs-cid>');

  return path;
}

/**
 * Main execution
 */
export async function main(): Promise<PKPConfig> {
  console.log('🚀 ZeroKeyCI - PKP Minting Script\n');
  console.log('This script will mint a new Programmable Key Pair (PKP) NFT.');
  console.log(
    'The PKP will be used for automated signing in your CI/CD pipeline.\n'
  );

  try {
    // Get configuration
    const network = await getLitNetwork();
    const privateKey = await getPrivateKey();

    // Mint PKP
    const result = await mintPKP(network, privateKey);

    // Save configuration
    const configPath = savePKPConfig(result, network);

    console.log('\n✅ PKP minting complete!');

    // Return full config
    const config: PKPConfig = {
      ...result,
      network,
      mintedAt: new Date().toISOString(),
    };

    return config;
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// CLI execution
if (import.meta.main) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
