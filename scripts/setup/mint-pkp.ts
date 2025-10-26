// scripts/setup/mint-pkp.ts
// #!/usr/bin / env bun
/**
 * Real PKP Minting Script for ZeroKeyCI (Bun/Node runtime)
 *
 * Fixes:
 *  - Use LIT_NETWORK enum (not plain strings)
 *  - Initialize node-localstorage for non-browser
 *  - Ethers v5-compatible imports
 *
 * Requirements:
 *   npm i @lit-protocol/lit-node-client @lit-protocol/contracts-sdk @lit-protocol/constants node-localstorage ethers@5
 *
 * Usage:
 *   LIT_NETWORK=datil-test ETHEREUM_PRIVATE_KEY=0x... bun run scripts/setup/mint-pkp.ts
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import {
  LIT_NETWORK,
  LIT_RPC,
  AUTH_METHOD_TYPE,
  AUTH_METHOD_SCOPE,
} from '@lit-protocol/constants';
import * as ethers from 'ethers';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import * as readline from 'readline';

// Setup node-localstorage for non-browser runtime (Lit SDK expects storage)
import { LocalStorage } from 'node-localstorage';
// @ts-ignore global assignment for SDK
(globalThis as any).localStorage =
  (globalThis as any).localStorage || new LocalStorage('./.lit-localstorage');

type LitNetworkStr = 'datil-dev' | 'datil-test' | 'datil';

export interface PKPMintResult {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  mintTxHash?: string;
}

export interface PKPConfig {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
  network: string;
  mintedAt: string;
  mintTxHash?: string;
}

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

async function getLitNetworkStr(): Promise<LitNetworkStr> {
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

export async function getLitNetwork(): Promise<LitNetworkStr> {
  return getLitNetworkStr();
}

function getRpcForLit(): string {
  // Per Lit docs examples: use Chronicle Yellowstone RPC
  return LIT_RPC.CHRONICLE_YELLOWSTONE;
}

export async function getPrivateKey(): Promise<string> {
  const envKey = process.env.ETHEREUM_PRIVATE_KEY;
  if (envKey) {
    const v = validatePrivateKey(envKey);
    if (v.valid) {
      console.log('🔑 Using ETHEREUM_PRIVATE_KEY from env');
      return envKey;
    }
    console.warn(`⚠️ Invalid ETHEREUM_PRIVATE_KEY: ${v.error}`);
  }
  console.log(
    '\n🔑 Enter Ethereum private key (0x + 64 hex) to pay minting gas:'
  );
  const input = await prompt('Private key (0x...): ');
  const v = validatePrivateKey(input);
  if (!v.valid) throw new Error(v.error || 'Invalid private key');
  return input;
}

export async function mintPKP(
  networkStr: LitNetworkStr,
  privateKey: string
): Promise<PKPMintResult> {
  console.log(`\n🔨 Minting PKP on ${networkStr} ...`);

  // Provider & signer (ethers v5)
  const provider = new ethers.providers.JsonRpcProvider(getRpcForLit());
  const signer = new ethers.Wallet(privateKey, provider);
  console.log(`   Minting from address: ${signer.address}`);

  // Lit Node Client (use string network name directly)
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

  // Lit Contracts (use litNetwork parameter, not network)
  const litContracts = new LitContracts({
    signer,
    litNetwork: networkStr,
    debug: false,
  });
  try {
    await litContracts.connect();
    console.log('✅ Connected to Lit contracts');
  } catch (error) {
    await litNodeClient.disconnect();
    throw new Error(
      `Failed to connect to Lit contracts: ${error instanceof Error ? error.message : error}`
    );
  }

  try {
    // Create authentication signature for PKP minting
    console.log('🔐 Creating authentication signature...');
    const authMessage = 'Lit Protocol PKP Mint Authorization';
    const authSig = await signer.signMessage(authMessage);

    // Create auth method for EthWallet
    const authMethod = {
      authMethodType: AUTH_METHOD_TYPE.EthWallet,
      accessToken: JSON.stringify({
        sig: authSig,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: authMessage,
        address: signer.address,
      }),
    };

    // Mint PKP using the correct SDK method
    console.log('⏳ Minting PKP NFT with authentication...');
    const mintInfo = await litContracts.mintWithAuth({
      authMethod: authMethod,
      scopes: [AUTH_METHOD_SCOPE.SignAnything, AUTH_METHOD_SCOPE.PersonalSign],
    });

    console.log(`✅ Mint tx: ${mintInfo.tx.transactionHash}`);
    console.log(`✅ Confirmed in block ${mintInfo.tx.blockNumber}`);

    // Extract PKP details from mint result
    const { tokenId, publicKey, ethAddress } = mintInfo.pkp;

    // Validate public key format
    if (!publicKey || !publicKey.startsWith('0x04')) {
      throw new Error('Invalid PKP public key (expected uncompressed 0x04...)');
    }

    await litNodeClient.disconnect();

    return {
      tokenId,
      publicKey,
      ethAddress,
      mintTxHash: mintInfo.tx.transactionHash,
    };
  } catch (error) {
    await litNodeClient.disconnect();
    throw new Error(
      `Failed to mint PKP: ${error instanceof Error ? error.message : error}`
    );
  }
}

export function savePKPConfig(
  result: PKPMintResult,
  networkStr: LitNetworkStr,
  configPath?: string
): string {
  const path =
    configPath || process.env.PKP_CONFIG_PATH || '.zerokey/pkp-config.json';
  const config: PKPConfig = {
    tokenId: result.tokenId,
    publicKey: result.publicKey,
    ethAddress: result.ethAddress,
    network: networkStr,
    mintedAt: new Date().toISOString(),
    mintTxHash: result.mintTxHash,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2));
  console.log(`\n💾 Saved PKP config: ${path}`);
  console.log('\n📋 Next Steps:');
  console.log('   1) Grant Lit Action permission:');
  console.log('      bun run scripts/setup/grant-lit-action-permission.ts');
  console.log('   2) Add PKP as Safe owner:');
  console.log('      bun run scripts/setup/add-pkp-to-safe.ts');
  console.log('   3) Configure GitHub Secrets:');
  console.log(`      PKP_PUBLIC_KEY=${result.ethAddress}`);
  console.log('      LIT_ACTION_IPFS_CID=<your-lit-action-ipfs-cid>');
  return path;
}

export async function main(): Promise<PKPConfig> {
  console.log('🚀 ZeroKeyCI - PKP Minting (Real)\n');
  const networkStr = await getLitNetworkStr();
  const privateKey = await getPrivateKey();
  const res = await mintPKP(networkStr, privateKey);
  const _path = savePKPConfig(res, networkStr);
  console.log('\n✅ PKP minted successfully!');
  return {
    tokenId: res.tokenId,
    publicKey: res.publicKey,
    ethAddress: res.ethAddress,
    network: networkStr,
    mintedAt: new Date().toISOString(),
    mintTxHash: res.mintTxHash,
  };
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('\n❌ Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
