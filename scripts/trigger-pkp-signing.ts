#!/usr/bin/env bun
/**
 * Trigger PKP Signing Script
 *
 * This script triggers Lit Protocol PKP to sign a Safe transaction proposal.
 * It loads the proposal, validates it with the Lit Action, signs with PKP,
 * and submits the signed transaction to the Safe.
 *
 * Phase 3 of Lit Protocol PKP Integration (Issue #30)
 *
 * Environment Variables Required:
 * - PKP_PUBLIC_KEY: The PKP's Ethereum address
 * - LIT_ACTION_IPFS_CID: IPFS hash of the Lit Action code
 * - SAFE_ADDRESS: The Safe multisig address
 * - LIT_NETWORK: Lit network to use (datil-dev, datil-test, datil)
 * - GITHUB_TOKEN: GitHub token for PR comments
 * - GITHUB_REPOSITORY: GitHub repository (owner/repo)
 * - GITHUB_PR_NUMBER: Pull request number
 */

import { readFileSync } from 'fs';
import { LitPKPSigner } from '../src/services/LitPKPSigner';
import SafeApiKit from '@safe-global/api-kit';
import type { SafeTransaction } from '../src/types/safe';

export interface EnvironmentConfig {
  pkpPublicKey: string;
  litActionIpfsCid: string;
  litNetwork: string;
  safeAddress: string;
  githubToken?: string;
  githubRepository?: string;
  githubPrNumber?: string;
}

export interface SignatureResult {
  r: string;
  s: string;
  v: number;
}

export interface PRReportOptions {
  status: 'success' | 'failure';
  safeTxHash?: string;
  pkpAddress: string;
  error?: string;
}

export interface WorkflowResult {
  success: boolean;
  safeTxHash?: string;
  error?: string;
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  const pkpPublicKey = process.env.PKP_PUBLIC_KEY;
  const litActionIpfsCid = process.env.LIT_ACTION_IPFS_CID;
  const safeAddress = process.env.SAFE_ADDRESS;
  const litNetwork = process.env.LIT_NETWORK || 'datil-dev';

  if (!pkpPublicKey) {
    throw new Error('PKP_PUBLIC_KEY environment variable is required');
  }

  if (!litActionIpfsCid) {
    throw new Error('LIT_ACTION_IPFS_CID environment variable is required');
  }

  if (!safeAddress) {
    throw new Error('SAFE_ADDRESS environment variable is required');
  }

  return {
    pkpPublicKey,
    litActionIpfsCid,
    litNetwork,
    safeAddress,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepository: process.env.GITHUB_REPOSITORY,
    githubPrNumber: process.env.GITHUB_PR_NUMBER,
  };
}

/**
 * Load Safe proposal from JSON file
 */
export function loadProposal(filePath: string): SafeTransaction {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const proposal = JSON.parse(content) as SafeTransaction;

    // Validate required fields
    if (!proposal.safe || !proposal.to || !proposal.data) {
      throw new Error(
        'Invalid proposal: missing required fields (safe, to, data)'
      );
    }

    console.log('📄 Loaded Safe proposal:');
    console.log(`  Safe: ${proposal.safe}`);
    console.log(`  To: ${proposal.to}`);
    console.log(`  Data: ${proposal.data.substring(0, 66)}...`);
    console.log(`  Validation Hash: ${proposal.validationHash}`);

    return proposal;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load proposal from ${filePath}: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Sign Safe transaction with PKP using Lit Protocol
 */
export async function signWithPKP(
  proposal: SafeTransaction,
  config?: EnvironmentConfig
): Promise<SignatureResult> {
  const envConfig = config || validateEnvironment();

  console.log('🔐 Signing with PKP...');
  console.log(`  PKP Address: ${envConfig.pkpPublicKey}`);
  console.log(`  Lit Action IPFS CID: ${envConfig.litActionIpfsCid}`);
  console.log(`  Lit Network: ${envConfig.litNetwork}`);

  try {
    const signer = new LitPKPSigner({
      pkpPublicKey: envConfig.pkpPublicKey,
      litNetwork: envConfig.litNetwork as 'datil-dev' | 'datil-test' | 'datil',
    });

    // Sign the Safe transaction with Lit Action validation
    const signature = await signer.signSafeTransaction(proposal, {
      ipfsCid: envConfig.litActionIpfsCid,
      jsParams: {
        safeAddress: proposal.safe,
        transactionHash: proposal.validationHash,
        // Additional params for Lit Action validation
        opaEndpoint: process.env.OPA_ENDPOINT || 'http://localhost:8181',
        githubToken: envConfig.githubToken,
        prNumber: envConfig.githubPrNumber,
      },
    });

    console.log('✅ PKP signature obtained');
    console.log(`  r: ${signature.r.substring(0, 10)}...`);
    console.log(`  s: ${signature.s.substring(0, 10)}...`);
    console.log(`  v: ${signature.v}`);

    return signature;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ PKP signing failed:', error.message);
      throw new Error(`PKP signing failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Submit signed transaction to Safe Transaction Service
 */
export async function submitToSafe(
  proposal: SafeTransaction,
  signature: SignatureResult,
  config?: EnvironmentConfig
): Promise<string> {
  const envConfig = config || validateEnvironment();

  console.log('📤 Submitting signed transaction to Safe...');

  try {
    // Determine chain ID from Safe address or environment
    // For now, default to Sepolia (11155111)
    const chainId = '11155111'; // TODO: Make this configurable

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
      senderAddress: envConfig.pkpPublicKey,
      senderSignature: signatureData,
    });

    const safeTxHash = result.safeTxHash || proposal.validationHash;

    console.log('✅ Transaction submitted to Safe');
    console.log(`  Safe Tx Hash: ${safeTxHash}`);

    return safeTxHash;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Safe submission failed:', error.message);
      throw new Error(`Safe submission failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Report signing status to GitHub PR
 */
export async function reportToPR(options: PRReportOptions): Promise<void> {
  const { githubToken, githubRepository, githubPrNumber } =
    validateEnvironment();

  if (!githubToken || !githubRepository || !githubPrNumber) {
    console.log('⚠️  GitHub PR reporting skipped (missing credentials)');
    return;
  }

  const { status, safeTxHash, pkpAddress, error } = options;

  let comment = '';

  if (status === 'success' && safeTxHash) {
    comment = `## ✅ PKP Signature Applied

A Lit Protocol PKP has successfully signed this deployment proposal.

### 🔐 Signing Details
- **PKP Address**: \`${pkpAddress}\`
- **Safe Tx Hash**: \`${safeTxHash}\`
- **Network**: Lit Protocol ${process.env.LIT_NETWORK || 'datil-dev'}

### 📋 Next Steps
1. Additional Safe owners can review and sign
2. Once threshold is reached, execute the transaction
3. Contract will be deployed at deterministic address

### 🔍 Verification
- PKP signing was conditional (passed OPA validation, tests, and PR checks)
- Signature added to Safe transaction proposal
- Full audit trail maintained

---
*Automated signing by Lit Protocol PKP - ZeroKeyCI*`;
  } else {
    comment = `## ❌ PKP Signing Failed

The Lit Protocol PKP was unable to sign this deployment proposal.

### ⚠️ Error Details
\`\`\`
${error || 'Unknown error'}
\`\`\`

### 🔍 Troubleshooting
- Verify OPA policies passed
- Check Lit Action validation conditions
- Review Lit Protocol network status
- Ensure PKP has necessary permissions

### 📋 Manual Action Required
Safe owners can still manually sign and execute this proposal if conditions are met.

---
*Automated signing attempted by Lit Protocol PKP - ZeroKeyCI*`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepository}/issues/${githubPrNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({ body: comment }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    console.log('✅ Status reported to PR');
  } catch (error) {
    console.error('⚠️  Failed to report to PR:', error);
    // Don't throw - reporting failure shouldn't fail the whole workflow
  }
}

/**
 * Main workflow
 */
export async function main(proposalPath: string): Promise<WorkflowResult> {
  try {
    console.log('🚀 Starting PKP signing workflow...\n');

    // Step 1: Validate environment
    const config = validateEnvironment();
    console.log('✅ Environment validated\n');

    // Step 2: Load proposal
    const proposal = loadProposal(proposalPath);
    console.log('✅ Proposal loaded\n');

    // Step 3: Sign with PKP
    const signature = await signWithPKP(proposal, config);
    console.log('✅ PKP signature obtained\n');

    // Step 4: Submit to Safe
    const safeTxHash = await submitToSafe(proposal, signature, config);
    console.log('✅ Transaction submitted to Safe\n');

    // Step 5: Report to PR
    await reportToPR({
      status: 'success',
      safeTxHash,
      pkpAddress: config.pkpPublicKey,
    });
    console.log('✅ Status reported to PR\n');

    console.log('🎉 PKP signing workflow completed successfully!');

    return {
      success: true,
      safeTxHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('❌ PKP signing workflow failed:', errorMessage);

    // Try to report failure to PR
    try {
      const config = validateEnvironment();
      await reportToPR({
        status: 'failure',
        error: errorMessage,
        pkpAddress: config.pkpPublicKey,
      });
    } catch (reportError) {
      console.error('⚠️  Failed to report error to PR:', reportError);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// CLI execution
if (import.meta.main) {
  const proposalPath = process.argv[2] || 'safe-proposal.json';

  main(proposalPath)
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Success!');
        console.log(`Safe Tx Hash: ${result.safeTxHash}`);
        process.exit(0);
      } else {
        console.error('\n❌ Failed!');
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Unexpected error:', error);
      process.exit(1);
    });
}
