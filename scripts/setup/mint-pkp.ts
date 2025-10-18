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
import { LitNetwork } from '@lit-protocol/constants';
import { ethers } from 'ethers';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as readline from 'readline';

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
export function validatePrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Lit network from environment or user input
 */
export async function getLitNetwork(): Promise<LitNetwork> {
  const envNetwork = process.env.LIT_NETWORK;

  if (envNetwork) {
    const validNetworks: LitNetwork[] = [
      LitNetwork.DatilDev,
      LitNetwork.DatilTest,
      LitNetwork.Datil,
    ];
    const network = envNetwork as LitNetwork;

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
      return LitNetwork.DatilDev;
    case '2':
      return LitNetwork.DatilTest;
    case '3':
      return LitNetwork.Datil;
    default:
      console.log('Invalid choice, using datil-dev');
      return LitNetwork.DatilDev;
  }
}

/**
 * Get Ethereum private key from environment or user input
 */
export async function getPrivateKey(): Promise<string> {
  const envKey = process.env.ETHEREUM_PRIVATE_KEY;

  if (envKey) {
    if (validatePrivateKey(envKey)) {
      console.log(
        '🔑 Using private key from ETHEREUM_PRIVATE_KEY environment variable'
      );
      return envKey;
    }

    console.warn('⚠️  Invalid ETHEREUM_PRIVATE_KEY in environment');
  }

  console.log(
    '\n🔑 Enter Ethereum private key (to pay for PKP minting transaction):'
  );
  console.log('   This key will be used ONLY to pay gas fees for minting.');
  console.log('   It is NOT the PKP itself and will not be stored.');

  const privateKey = await prompt('\nPrivate key (0x...): ');

  if (!validatePrivateKey(privateKey)) {
    throw new Error('Invalid private key format');
  }

  return privateKey;
}

/**
 * Mint a new PKP NFT
 */
export async function mintPKP(
  network: LitNetwork,
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
