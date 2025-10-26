// scripts/setup/upload-lit-action.ts
/**
 * Lit Action IPFS Upload Script
 *
 * Uploads the compiled Lit Action JavaScript code to IPFS and returns the CID.
 * The CID is required for:
 * - Granting Lit Action permission to PKP (grant-lit-action-permission.ts)
 * - GitHub Secrets configuration (LIT_ACTION_IPFS_CID)
 *
 * Usage:
 *   LIT_NETWORK=datil-test bun run scripts/setup/upload-lit-action.ts
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as readline from 'readline';

type LitNetworkStr = 'datil-dev' | 'datil-test' | 'datil';

const LIT_ACTION_SOURCE_PATH = 'src/lit-actions/conditionalSigner.js';
const PKP_CONFIG_PATH = '.zerokey/pkp-config.json';

interface PKPConfig {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  network: string;
  mintedAt: string;
  mintTxHash?: string;
  litActionCID?: string;
  litActionUploadedAt?: string;
}

/**
 * Prompt user for input
 */
async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

/**
 * Get Lit Network from environment or prompt
 */
async function getLitNetwork(): Promise<LitNetworkStr> {
  const env = process.env.LIT_NETWORK;
  const valid: LitNetworkStr[] = ['datil-dev', 'datil-test', 'datil'];

  if (env && valid.includes(env as LitNetworkStr)) {
    console.log(`📡 Using LIT_NETWORK from env: ${env}`);
    return env as LitNetworkStr;
  }

  if (env) {
    console.warn(
      `⚠️ Invalid LIT_NETWORK value "${env}". Must be one of: ${valid.join(', ')}`
    );
  }

  console.log('\n📡 Select Lit Protocol Network:');
  console.log('  1. datil-dev (Development/Testing)');
  console.log('  2. datil-test (Testnet)');
  console.log('  3. datil (Mainnet)');
  const choice = await prompt('\nEnter choice (1-3) [default: 1]: ');

  switch (choice || '1') {
    case '1':
      return 'datil-dev';
    case '2':
      return 'datil-test';
    case '3':
      return 'datil';
    default:
      return 'datil-dev';
  }
}

/**
 * Load Lit Action JavaScript code from file
 */
function loadLitActionCode(): string {
  try {
    const code = readFileSync(LIT_ACTION_SOURCE_PATH, 'utf-8');
    console.log(`✅ Loaded Lit Action: ${LIT_ACTION_SOURCE_PATH}`);
    console.log(`   File size: ${code.length} bytes`);
    return code;
  } catch (error) {
    throw new Error(
      `Failed to read Lit Action file: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Upload Lit Action to IPFS using Lit Protocol's built-in IPFS upload
 */
export async function uploadLitActionToIPFS(
  litActionCode: string,
  networkStr: LitNetworkStr
): Promise<string> {
  console.log(`\n📤 Uploading Lit Action to IPFS via Lit Protocol...`);
  console.log(`   Network: ${networkStr}`);

  const litNodeClient = new LitNodeClient({
    litNetwork: networkStr,
    debug: false,
  });

  try {
    await litNodeClient.connect();
    console.log('✅ Connected to Lit nodes');
  } catch (error) {
    throw new Error(
      `Failed to connect to Lit nodes: ${error instanceof Error ? error.message : error}`
    );
  }

  try {
    // Note: uploadLitAction was removed in Lit SDK v7+
    // For now, we'll provide a manual IPFS upload guide
    // Users can use: ipfs add, Pinata, or Web3.Storage

    console.log(
      '\n⚠️ Automated IPFS upload via Lit SDK is not available in v7+'
    );
    console.log('   You need to manually upload the Lit Action to IPFS.\n');

    // Check if user has already uploaded
    const hasUploaded = await prompt(
      'Have you already uploaded the file to IPFS? (y/N): '
    );

    if (hasUploaded.toLowerCase() !== 'y') {
      console.log('\n📋 Please upload the file using one of these methods:\n');

      console.log('Option 1: IPFS CLI (if you have IPFS installed)');
      console.log('   ipfs add src/lit-actions/conditionalSigner.js');
      console.log('   # Output: added <CID> conditionalSigner.js\n');

      console.log('Option 2: Pinata (requires API key)');
      console.log('   pinata upload src/lit-actions/conditionalSigner.js \\');
      console.log('     --name "ZeroKeyCI Conditional Signer" \\');
      console.log('     --key YOUR_PINATA_API_KEY');
      console.log('   # Output: IpfsHash: <CID>\n');

      console.log('Option 3: Web3.Storage (easiest - web UI, free)');
      console.log('   1. Visit: https://web3.storage');
      console.log('   2. Sign up/Login');
      console.log('   3. Upload: src/lit-actions/conditionalSigner.js');
      console.log('   4. Copy the CID from the upload confirmation\n');

      console.log('📝 After uploading, run this script again.\n');
      await litNodeClient.disconnect();
      throw new Error(
        'Please upload the file to IPFS first, then run this script again.'
      );
    }

    // User claims they've uploaded, ask for CID with retry logic
    let manualCID = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      manualCID = await prompt(
        '\nEnter IPFS CID from upload (starts with Qm...): '
      );

      if (manualCID && manualCID.trim().startsWith('Qm')) {
        // Valid CID format
        console.log(`✅ CID format valid: ${manualCID.trim()}`);
        await litNodeClient.disconnect();
        return manualCID.trim();
      }

      attempts++;
      console.log(
        `\n❌ Invalid CID format. CID must start with "Qm" (got: "${manualCID}")`
      );

      if (attempts < maxAttempts) {
        console.log(
          `   Please try again (${attempts}/${maxAttempts} attempts)\n`
        );
      } else {
        await litNodeClient.disconnect();
        throw new Error(
          'Failed to get valid IPFS CID after 3 attempts. CID must start with "Qm".'
        );
      }
    }

    await litNodeClient.disconnect();
    return manualCID;
  } catch (error) {
    await litNodeClient.disconnect();
    throw new Error(
      `Failed to get IPFS CID: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Load existing PKP config
 */
function loadPKPConfig(): PKPConfig | null {
  try {
    const configData = readFileSync(PKP_CONFIG_PATH, 'utf-8');
    return JSON.parse(configData) as PKPConfig;
  } catch (error) {
    return null;
  }
}

/**
 * Save updated PKP config with Lit Action CID
 */
function savePKPConfig(config: PKPConfig, litActionCID: string): void {
  const updatedConfig: PKPConfig = {
    ...config,
    litActionCID,
    litActionUploadedAt: new Date().toISOString(),
  };

  writeFileSync(PKP_CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
  console.log(`\n💾 Updated PKP config: ${PKP_CONFIG_PATH}`);
  console.log(`   Lit Action CID: ${litActionCID}`);
}

/**
 * Main workflow
 */
export async function main(): Promise<string> {
  console.log('🚀 ZeroKeyCI - Lit Action IPFS Upload\n');

  // 1. Load Lit Action code
  const litActionCode = loadLitActionCode();

  // 2. Get Lit Network
  const networkStr = await getLitNetwork();

  // 3. Upload to IPFS
  const ipfsCID = await uploadLitActionToIPFS(litActionCode, networkStr);

  // 4. Update PKP config
  const pkpConfig = loadPKPConfig();
  if (pkpConfig) {
    savePKPConfig(pkpConfig, ipfsCID);
  } else {
    console.warn(`\n⚠️ PKP config not found at ${PKP_CONFIG_PATH}`);
    console.log('   Please run: bun run scripts/setup/mint-pkp.ts first');
  }

  // 5. Show next steps
  console.log('\n📋 Next Steps:');
  console.log('   1) Grant Lit Action permission:');
  console.log('      bun run scripts/setup/grant-lit-action-permission.ts');
  console.log('   2) Add PKP to Safe:');
  console.log('      bun run scripts/setup/add-pkp-to-safe.ts');
  console.log('   3) Configure GitHub Secrets:');
  console.log(`      LIT_ACTION_IPFS_CID=${ipfsCID}`);
  console.log(`      LIT_NETWORK=${networkStr}`);

  console.log('\n✅ Lit Action uploaded successfully!');
  return ipfsCID;
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('\n❌ Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
