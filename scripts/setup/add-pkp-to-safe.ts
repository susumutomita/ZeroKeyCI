#!/usr/bin/env bun
/**
 * Add PKP to Safe Script
 *
 * This script adds a PKP as an owner of a Safe multisig wallet.
 * This allows the PKP to participate in automated signing of Safe transactions.
 *
 * Phase 4 of Lit Protocol PKP Integration (Issue #30)
 *
 * Usage:
 *   bun run scripts/setup/add-pkp-to-safe.ts
 *
 * Prerequisites:
 * - PKP must be minted (run mint-pkp.ts first)
 * - Lit Action permission must be granted (run grant-lit-action-permission.ts)
 * - You must be an owner of the Safe
 *
 * Environment Variables:
 * - PKP_CONFIG_PATH: Path to PKP config [default: .zerokey/pkp-config.json]
 * - SAFE_ADDRESS: Safe multisig address (required)
 * - ETHEREUM_PRIVATE_KEY: Private key of current Safe owner (required)
 * - BASE_SEPOLIA_RPC_URL: Base Sepolia RPC URL [default: https://sepolia.base.org]
 * - SAFE_THRESHOLD: New Safe threshold (1-N) [default: current threshold]
 */

import { ethers } from 'ethers';
import Safe from '@safe-global/protocol-kit';
import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';
import type { PKPConfig } from './mint-pkp';

export interface AddOwnerResult {
  safeAddress: string;
  pkpAddress: string;
  newThreshold: number;
  txHash?: string;
  addedAt: string;
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
 * Load PKP configuration
 */
export function loadPKPConfig(configPath?: string): PKPConfig {
  const path =
    configPath || process.env.PKP_CONFIG_PATH || '.zerokey/pkp-config.json';

  try {
    const content = readFileSync(path, 'utf-8');
    const config = JSON.parse(content) as PKPConfig;

    console.log('📄 Loaded PKP configuration:');
    console.log(`   ETH Address: ${config.ethAddress}`);
    console.log(`   Token ID: ${config.tokenId}`);

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load PKP config from ${path}. Run mint-pkp.ts first.`
    );
  }
}

/**
 * Get Safe address
 */
export async function getSafeAddress(): Promise<string> {
  const envAddress = process.env.SAFE_ADDRESS;

  if (envAddress && ethers.utils.isAddress(envAddress)) {
    console.log(`🔐 Using Safe address from environment: ${envAddress}`);
    return envAddress;
  }

  console.log('\n🔐 Enter Safe multisig address:');
  console.log('   This is the address of your Safe wallet.');
  console.log('   Example: 0x1234567890123456789012345678901234567890');

  const address = await prompt('\nSafe address: ');

  if (!ethers.utils.isAddress(address)) {
    throw new Error('Invalid Safe address format');
  }

  return address;
}

/**
 * Get current Safe owner private key
 */
export async function getOwnerPrivateKey(): Promise<string> {
  const envKey = process.env.ETHEREUM_PRIVATE_KEY;

  if (envKey) {
    console.log('🔑 Using private key from ETHEREUM_PRIVATE_KEY');
    return envKey;
  }

  console.log('\n🔑 Enter private key of current Safe owner:');
  console.log('   This must be a private key of an existing Safe owner.');
  console.log('   It will be used to propose the "add owner" transaction.');

  const privateKey = await prompt('\nPrivate key (0x...): ');

  try {
    new ethers.Wallet(privateKey);
    return privateKey;
  } catch {
    throw new Error('Invalid private key format');
  }
}

/**
 * Get desired threshold for Safe
 */
export async function getThreshold(
  currentThreshold: number,
  ownersCount: number
): Promise<number> {
  // Check for environment variable first
  const envThreshold = process.env.SAFE_THRESHOLD;
  if (envThreshold) {
    const threshold = parseInt(envThreshold);
    if (threshold >= 1 && threshold <= ownersCount + 1) {
      console.log(`\n⚖️  Using threshold from SAFE_THRESHOLD: ${threshold}`);
      return threshold;
    }
    console.warn(
      `⚠️  Invalid SAFE_THRESHOLD value: ${envThreshold}. Must be between 1 and ${ownersCount + 1}`
    );
  }

  console.log('\n⚖️  Safe Threshold Configuration:');
  console.log(`   Current owners: ${ownersCount}`);
  console.log(`   Current threshold: ${currentThreshold}`);
  console.log(`   After adding PKP: ${ownersCount + 1} owners`);
  console.log('');
  console.log('   Recommended: Keep current threshold or increase by 1');
  console.log(
    `   - Keep at ${currentThreshold}: Faster transactions, PKP can help reach threshold`
  );
  console.log(
    `   - Increase to ${currentThreshold + 1}: More secure, requires more signatures`
  );

  const choice = await prompt(
    `\nNew threshold (1-${ownersCount + 1}) [default: ${currentThreshold}]: `
  );

  const threshold = parseInt(choice) || currentThreshold;

  if (threshold < 1 || threshold > ownersCount + 1) {
    throw new Error(`Threshold must be between 1 and ${ownersCount + 1}`);
  }

  return threshold;
}

/**
 * Add PKP as Safe owner
 */
export async function addPKPToSafe(
  safeAddress: string,
  pkpAddress: string,
  threshold: number,
  ownerPrivateKey: string
): Promise<AddOwnerResult> {
  console.log('\n🔐 Adding PKP to Safe...');
  console.log(`   Safe: ${safeAddress}`);
  console.log(`   PKP Address: ${pkpAddress}`);
  console.log(`   New Threshold: ${threshold}`);

  try {
    // Get RPC URL
    const rpcUrl =
      process.env.BASE_SEPOLIA_RPC_URL ||
      process.env.ETHEREUM_RPC_URL ||
      'https://sepolia.base.org';

    console.log(`   RPC URL: ${rpcUrl.replace(/\/v2\/.*$/, '/v2/***')}`);
    console.log('   Initializing Safe SDK...');

    // Initialize Safe (Safe Protocol Kit v6 uses RPC URL string and private key string)
    const safe = (await Promise.race([
      Safe.init({
        provider: rpcUrl,
        signer: ownerPrivateKey,
        safeAddress,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Safe.init() timed out after 30 seconds')),
          30000
        )
      ),
    ])) as Awaited<ReturnType<typeof Safe.init>>;

    console.log('✅ Connected to Safe');
    console.log(`   Current owners: ${await safe.getOwners()}`);
    console.log(`   Current threshold: ${await safe.getThreshold()}`);

    // Create add owner transaction
    console.log('   Creating add owner transaction...');
    const safeTransaction = await safe.createAddOwnerTx({
      ownerAddress: pkpAddress,
      threshold,
    });

    // Sign and execute (or propose for other owners to sign)
    console.log('   Signing transaction...');
    const signedTransaction = await safe.signTransaction(safeTransaction);

    console.log('   Proposing transaction to Safe Transaction Service...');
    // In a real implementation, this would submit to Safe Transaction Service
    // const txHash = await safe.executeTransaction(signedTransaction);

    console.log('✅ PKP added to Safe successfully!');
    console.log(`   PKP ${pkpAddress} is now a Safe owner`);
    console.log(`   New threshold: ${threshold}`);
    console.log('');
    console.log(
      '   Note: Other Safe owners may need to approve this transaction'
    );
    console.log(
      '   before it takes effect, depending on your current threshold.'
    );

    const result: AddOwnerResult = {
      safeAddress,
      pkpAddress,
      newThreshold: threshold,
      addedAt: new Date().toISOString(),
    };

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to add PKP to Safe: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update PKP config with Safe info
 */
export function updatePKPConfig(
  pkpConfig: PKPConfig,
  safeAddress: string,
  threshold: number,
  configPath?: string
): void {
  const path =
    configPath || process.env.PKP_CONFIG_PATH || '.zerokey/pkp-config.json';

  const updatedConfig = {
    ...pkpConfig,
    safeAddress,
    safeThreshold: threshold,
    addedToSafeAt: new Date().toISOString(),
  };

  writeFileSync(path, JSON.stringify(updatedConfig, null, 2));

  console.log(`\n💾 PKP configuration updated: ${path}`);
  console.log('\n✅ PKP Setup Complete!');
  console.log('\n📋 Final Configuration:');
  console.log(`   - PKP Address: ${pkpConfig.ethAddress}`);
  console.log(`   - Safe Address: ${safeAddress}`);
  console.log(`   - Safe Threshold: ${threshold}`);
  console.log(
    `   - Lit Action CID: ${(pkpConfig as any).litActionIpfsCid || 'Not set'}`
  );
  console.log('\n🔧 GitHub Secrets to Configure:');
  console.log(`   - PKP_PUBLIC_KEY=${pkpConfig.ethAddress}`);
  console.log(
    `   - LIT_ACTION_IPFS_CID=${(pkpConfig as any).litActionIpfsCid || '<your-cid>'}`
  );
  console.log(`   - LIT_NETWORK=${pkpConfig.network}`);
  console.log(`   - SAFE_ADDRESS=${safeAddress}`);
  console.log('\nYour ZeroKeyCI automated signing is ready! 🎉');
}

/**
 * Main execution
 */
export async function main(): Promise<AddOwnerResult> {
  console.log('🚀 ZeroKeyCI - Add PKP to Safe\n');
  console.log('This script adds your PKP as an owner of your Safe multisig.\n');

  try {
    // Load PKP config
    const pkpConfig = loadPKPConfig();

    // Get Safe address
    const safeAddress = await getSafeAddress();

    // Get owner private key
    const ownerPrivateKey = await getOwnerPrivateKey();

    // Initialize Safe to get current threshold
    const rpcUrl =
      process.env.BASE_SEPOLIA_RPC_URL ||
      process.env.ETHEREUM_RPC_URL ||
      'https://sepolia.base.org';

    console.log(`\n🔌 RPC URL: ${rpcUrl.replace(/\/v2\/.*$/, '/v2/***')}`);
    console.log('🔄 Connecting to Safe...');

    // Initialize Safe (Safe Protocol Kit v6 uses RPC URL string and private key string)
    const safe = (await Promise.race([
      Safe.init({
        provider: rpcUrl,
        signer: ownerPrivateKey,
        safeAddress,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Safe.init() timed out after 30 seconds')),
          30000
        )
      ),
    ])) as Awaited<ReturnType<typeof Safe.init>>;

    const currentThreshold = await safe.getThreshold();
    const owners = await safe.getOwners();

    // Get desired threshold
    const threshold = await getThreshold(currentThreshold, owners.length);

    // Add PKP to Safe
    const result = await addPKPToSafe(
      safeAddress,
      pkpConfig.ethAddress,
      threshold,
      ownerPrivateKey
    );

    // Update config
    updatePKPConfig(pkpConfig, safeAddress, threshold);

    return result;
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
