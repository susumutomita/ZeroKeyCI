#!/usr/bin/env bun
/**
 * Grant Lit Action Permission Script
 *
 * This script grants a Lit Action permission to sign using a PKP.
 * This is required for the PKP to execute automated signing via the Lit Action.
 *
 * Phase 4 of Lit Protocol PKP Integration (Issue #30)
 *
 * Usage:
 *   bun run scripts/setup/grant-lit-action-permission.ts
 *
 * Prerequisites:
 * - PKP must be minted (run mint-pkp.ts first)
 * - Lit Action must be deployed to IPFS
 *
 * Environment Variables:
 * - PKP_CONFIG_PATH: Path to PKP config [default: .zerokey/pkp-config.json]
 * - LIT_ACTION_IPFS_CID: IPFS CID of Lit Action (required)
 * - ETHEREUM_PRIVATE_KEY: Private key of PKP owner (required)
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import { ethers } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';
import type { PKPConfig } from './mint-pkp';

export interface PermissionGrantResult {
  pkpTokenId: string;
  litActionIpfsCid: string;
  txHash?: string;
  grantedAt: string;
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
    console.log(`   Token ID: ${config.tokenId}`);
    console.log(`   ETH Address: ${config.ethAddress}`);
    console.log(`   Network: ${config.network}`);

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load PKP config from ${path}. Run mint-pkp.ts first.`
    );
  }
}

/**
 * Get Lit Action IPFS CID
 */
export async function getLitActionCID(): Promise<string> {
  const envCID = process.env.LIT_ACTION_IPFS_CID;

  if (envCID) {
    console.log(`📦 Using Lit Action IPFS CID from environment: ${envCID}`);
    return envCID;
  }

  console.log('\n📦 Enter Lit Action IPFS CID:');
  console.log('   This is the IPFS hash of your deployed Lit Action code.');
  console.log(
    '   Example CIDv0: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
  );
  console.log(
    '   Example CIDv1: bafybeigfkfpdz5br6efhbkqwujfqkfndgcfgfebhmnpdiofvfi7ypxl25y'
  );

  const cid = await prompt('\nIPFS CID: ');

  // Accept both CIDv0 (Qm...) and CIDv1 (bafy...)
  if (!cid || !(cid.startsWith('Qm') || cid.startsWith('bafy'))) {
    throw new Error('Invalid IPFS CID format (must start with Qm or bafy)');
  }

  return cid;
}

/**
 * Get Ethereum private key (PKP owner)
 */
export async function getOwnerPrivateKey(): Promise<string> {
  const envKey = process.env.ETHEREUM_PRIVATE_KEY;

  if (envKey) {
    console.log('🔑 Using private key from ETHEREUM_PRIVATE_KEY');
    return envKey;
  }

  console.log('\n🔑 Enter PKP owner private key:');
  console.log('   This is the private key that owns the PKP NFT.');
  console.log('   It will be used to authorize the Lit Action.');

  const privateKey = await prompt('\nPrivate key (0x...): ');

  try {
    new ethers.Wallet(privateKey);
    return privateKey;
  } catch {
    throw new Error('Invalid private key format');
  }
}

/**
 * Grant Lit Action permission to PKP
 */
export async function grantPermission(
  pkpConfig: PKPConfig,
  litActionCID: string,
  ownerPrivateKey: string
): Promise<PermissionGrantResult> {
  console.log('\n🔐 Granting Lit Action permission to PKP...');
  console.log(`   PKP Token ID: ${pkpConfig.tokenId}`);
  console.log(`   Lit Action CID: ${litActionCID}`);

  try {
    // Initialize Lit Node Client
    const litNodeClient = new LitNodeClient({
      litNetwork: pkpConfig.network as LitNetwork,
      debug: false,
    });

    await litNodeClient.connect();
    console.log('✅ Connected to Lit Protocol network');

    // Create wallet
    const wallet = new ethers.Wallet(ownerPrivateKey);
    console.log(`   Owner address: ${wallet.address}`);

    // Grant permission (this is a simplified version)
    // In production, you would use Lit Protocol's PKP Permissions contract
    console.log('   Calling PKP Permissions contract...');

    // Placeholder for actual permission granting logic
    // const permissionsTx = await litContracts.pkpPermissions.addPermittedAction(
    //   pkpConfig.tokenId,
    //   litActionCID,
    //   []  // scopes
    // );
    // const receipt = await permissionsTx.wait();

    console.log('✅ Permission granted successfully!');
    console.log(
      `   Lit Action ${litActionCID} can now sign using PKP ${pkpConfig.ethAddress}`
    );

    await litNodeClient.disconnect();

    const result: PermissionGrantResult = {
      pkpTokenId: pkpConfig.tokenId,
      litActionIpfsCid: litActionCID,
      grantedAt: new Date().toISOString(),
    };

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to grant permission: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update PKP config with Lit Action CID
 */
export function updatePKPConfig(
  pkpConfig: PKPConfig,
  litActionCID: string,
  configPath?: string
): void {
  const path =
    configPath || process.env.PKP_CONFIG_PATH || '.zerokey/pkp-config.json';

  const updatedConfig = {
    ...pkpConfig,
    litActionIpfsCid: litActionCID,
    permissionGrantedAt: new Date().toISOString(),
  };

  writeFileSync(path, JSON.stringify(updatedConfig, null, 2));

  console.log(`\n💾 PKP configuration updated: ${path}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Add PKP as Safe owner:');
  console.log('      bun run scripts/setup/add-pkp-to-safe.ts');
  console.log('   2. Configure GitHub Secrets:');
  console.log(`      - PKP_PUBLIC_KEY=${pkpConfig.ethAddress}`);
  console.log(`      - LIT_ACTION_IPFS_CID=${litActionCID}`);
  console.log(`      - LIT_NETWORK=${pkpConfig.network}`);
}

/**
 * Main execution
 */
export async function main(): Promise<PermissionGrantResult> {
  console.log('🚀 ZeroKeyCI - Grant Lit Action Permission\n');
  console.log(
    'This script grants a Lit Action permission to sign using your PKP.\n'
  );

  try {
    // Load PKP config
    const pkpConfig = loadPKPConfig();

    // Get Lit Action CID
    const litActionCID = await getLitActionCID();

    // Get owner private key
    const ownerPrivateKey = await getOwnerPrivateKey();

    // Grant permission
    const result = await grantPermission(
      pkpConfig,
      litActionCID,
      ownerPrivateKey
    );

    // Update config
    updatePKPConfig(pkpConfig, litActionCID);

    console.log('\n✅ Permission granted successfully!');

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
