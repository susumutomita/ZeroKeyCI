#!/usr/bin/env bun
/**
 * テストスクリプト: Safe API proposeTransaction
 * 実際に動作するペイロードを確認
 */

import SafeApiKit from '@safe-global/api-kit';
import { readFileSync } from 'fs';

// Load safe-proposal.json from ZeroKeyCI-sample
const proposalPath =
  process.argv[2] ||
  '/Users/susumu/ethglobal/ZeroKeyCI-sample/safe-proposal.json';

console.log(`📂 Loading proposal from: ${proposalPath}`);
const proposalFile = readFileSync(proposalPath, 'utf-8');
const parsed = JSON.parse(proposalFile);

console.log('\n📋 Parsed proposal structure:');
console.log('  - parsed.proposal:', Object.keys(parsed.proposal));
console.log('  - parsed.validationHash:', parsed.validationHash);
console.log('  - parsed.chainId:', parsed.chainId);
console.log('  - parsed.safeAddress:', parsed.safeAddress);

// Prepare the payload that Safe API expects
const payload = {
  safeAddress: parsed.safeAddress,
  safeTransactionData: {
    to: parsed.proposal.to,
    value: parsed.proposal.value,
    data: parsed.proposal.data,
    operation: parsed.proposal.operation || 0,
    safeTxGas: parsed.proposal.safeTxGas || '0',
    baseGas: parsed.proposal.baseGas || '0',
    gasPrice: parsed.proposal.gasPrice || '0',
    gasToken:
      parsed.proposal.gasToken || '0x0000000000000000000000000000000000000000',
    refundReceiver:
      parsed.proposal.refundReceiver ||
      '0x0000000000000000000000000000000000000000',
    nonce: parsed.proposal.nonce || 0,
  },
  safeTxHash: parsed.validationHash, // ← これが重要！
  senderAddress: '0xYourSafeOwnerAddress', // REPLACE
  senderSignature: '0x',
};

console.log('\n✅ Correct payload structure for Safe API:');
console.log(JSON.stringify(payload, null, 2));

console.log('\n🔍 Validation checks:');
console.log('  - safeAddress:', payload.safeAddress ? '✅' : '❌');
console.log('  - safeTxHash:', payload.safeTxHash ? '✅' : '❌');
console.log('  - senderAddress:', payload.senderAddress ? '✅' : '❌');
console.log(
  '  - safeTransactionData.to:',
  payload.safeTransactionData.to ? '✅' : '❌'
);
console.log(
  '  - safeTransactionData.data:',
  payload.safeTransactionData.data ? '✅' : '❌'
);
console.log(
  '  - safeTransactionData.data length:',
  payload.safeTransactionData.data?.length || 0
);
