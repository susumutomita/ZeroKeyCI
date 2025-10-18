# Lit Action Setup Guide

This guide explains how to deploy and use the Conditional Signer Lit Action for automated PKP signing.

## Overview

The Conditional Signer Lit Action implements the core validation logic for automated Safe transaction signing using Lit Protocol PKPs. It verifies that all required conditions are met before signing:

- ✅ OPA policy validation passes
- ✅ All tests pass
- ✅ PR is merged
- ✅ GitHub API verification succeeds

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions (CI/CD)                   │
│                                                             │
│  1. Create Safe transaction proposal                       │
│  2. Trigger LitPKPSigner.signSafeTransaction()             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Lit Protocol Network (Decentralized)           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Lit Action: conditionalSigner.js             │  │
│  │                                                      │  │
│  │  3. Verify OPA policy (HTTP call to OPA server)     │  │
│  │  4. Verify tests passed (GitHub API)                │  │
│  │  5. Verify PR merged (GitHub API)                   │  │
│  │                                                      │  │
│  │  6. If all pass → Sign with PKP                     │  │
│  │     If any fail → Refuse to sign                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  PKP Private Key: Distributed across Lit nodes             │
│  (Never exists in full anywhere)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Gnosis Safe (On-chain)                     │
│                                                             │
│  7. Submit signed transaction to Safe                      │
│  8. Execute deployment                                     │
└─────────────────────────────────────────────────────────────┘
```

## Files

- **`src/lit-actions/conditionalSigner.ts`** - TypeScript source code with full type definitions
- **`src/lit-actions/conditionalSigner.js`** - Compiled JavaScript for IPFS storage
- **`src/lit-actions/__tests__/conditionalSigner.test.ts`** - Comprehensive test suite

## Deployment to IPFS

The Lit Action must be stored on IPFS so Lit Protocol nodes can retrieve and execute it.

### Option 1: Manual Upload to IPFS

```bash
# Install IPFS CLI
# https://docs.ipfs.io/install/

# Add file to IPFS
ipfs add src/lit-actions/conditionalSigner.js

# Output:
# added QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX conditionalSigner.js
```

### Option 2: Use Pinata (Pinning Service)

```bash
# Install Pinata CLI
npm install -g @pinata/cli

# Upload to Pinata
pinata upload src/lit-actions/conditionalSigner.js \
  --name "ZeroKeyCI Conditional Signer" \
  --key YOUR_PINATA_API_KEY

# Output:
# IpfsHash: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Option 3: Use Lit Protocol's Built-in IPFS Upload

```typescript
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { readFileSync } from 'fs';

const litNodeClient = new LitNodeClient({
  litNetwork: 'cayenne', // or 'habanero', 'mainnet'
});

await litNodeClient.connect();

const litActionCode = readFileSync('src/lit-actions/conditionalSigner.js', 'utf-8');

// Upload to IPFS via Lit Protocol
const ipfsCid = await litNodeClient.uploadLitAction(litActionCode);

console.log('Lit Action IPFS CID:', ipfsCid);
// Save this CID for later use
```

## Usage in LitPKPSigner

After deploying to IPFS, update the `LitPKPSigner` class to use the IPFS CID:

```typescript
// src/services/LitPKPSigner.ts

async signSafeTransaction(
  transaction: SafeTransactionData,
  sessionSigs: SessionSigsMap,
  conditions: SigningConditions
): Promise<ECDSASignature> {
  // ... validation code ...

  // Option 1: Use IPFS CID
  const ipfsCid = 'QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // From deployment

  const response = await this.litNodeClient.executeJs({
    ipfsId: ipfsCid,
    sessionSigs,
    jsParams: {
      dataToSign: utils.arrayify(txHash),
      publicKey: this.pkpPublicKey,
      conditions: {
        opaPolicyPassed: conditions.opaPolicyPassed,
        testsPassed: conditions.testsPassed,
        prMerged: conditions.prMerged,
      },
      opa: {
        policyEndpoint: process.env.OPA_POLICY_ENDPOINT!,
        deploymentConfig: conditions.deploymentConfig,
      },
      tests: {
        testResultsUrl: process.env.TEST_RESULTS_URL!,
      },
      github: {
        repoOwner: process.env.GITHUB_REPOSITORY!.split('/')[0],
        repoName: process.env.GITHUB_REPOSITORY!.split('/')[1],
        prNumber: parseInt(process.env.PR_NUMBER || '0'),
        githubToken: process.env.GITHUB_TOKEN!,
      },
    },
  });

  // ... signature processing ...
}
```

## Environment Variables

The Lit Action requires the following environment variables in GitHub Actions:

```yaml
# .github/workflows/deploy.yml

env:
  # OPA Policy Server
  OPA_POLICY_ENDPOINT: https://your-opa-server.com/v1/data/deployment/allow

  # GitHub API (automatically provided by GitHub Actions)
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  GITHUB_REPOSITORY: ${{ github.repository }}
  PR_NUMBER: ${{ github.event.pull_request.number }}

  # Test Results (GitHub Actions API)
  TEST_RESULTS_URL: https://api.github.com/repos/${{ github.repository }}/actions/runs/${{ github.run_id }}

  # Lit Protocol Configuration
  LIT_NETWORK: cayenne # or 'habanero', 'mainnet'
  LIT_PKP_PUBLIC_KEY: ${{ secrets.LIT_PKP_PUBLIC_KEY }}
  LIT_ACTION_IPFS_CID: ${{ secrets.LIT_ACTION_IPFS_CID }}
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
bun run test src/lit-actions/__tests__/conditionalSigner.test.ts

# Run with coverage
bun run test:coverage src/lit-actions/__tests__/conditionalSigner.test.ts

# Run in watch mode during development
bun run test:watch src/lit-actions/__tests__/conditionalSigner.test.ts
```

Test coverage:
- ✅ Parameter validation
- ✅ Conditional signing logic (all combinations)
- ✅ OPA policy verification
- ✅ Test results verification
- ✅ PR merge verification
- ✅ Error handling (API failures, network errors)
- ✅ Audit trail logging

## Security Considerations

### ✅ What IS Secure

1. **No Private Keys in CI/CD**: PKP private key is distributed across Lit Protocol's decentralized network
2. **Conditional Signing**: Signing only happens if all validation checks pass
3. **Audit Trail**: Complete logging of all verification steps
4. **Immutable Code**: Lit Action stored on IPFS (content-addressed, tamper-proof)
5. **Session-based Auth**: Uses session signatures for Lit Protocol authentication

### ⚠️ What to Protect

1. **GitHub Token**: Ensure `GITHUB_TOKEN` has minimal permissions (read-only for PR status)
2. **OPA Endpoint**: OPA server should be secured with authentication
3. **PKP Permissions**: Only grant Lit Action permission to specific PKP (using `pkpPermit`)
4. **Session Signatures**: Generate fresh session signatures for each signing operation

### 🚨 What NOT to Do

1. ❌ **Don't** hardcode PKP private key (it doesn't exist in full anyway)
2. ❌ **Don't** skip validation checks (defeats the purpose)
3. ❌ **Don't** expose OPA policy endpoint publicly without authentication
4. ❌ **Don't** use the same session signatures across multiple operations

## Troubleshooting

### Lit Action Fails to Execute

**Symptom**: `executeJs` throws error "Failed to load Lit Action from IPFS"

**Solution**:
1. Verify IPFS CID is correct
2. Check IPFS gateway is accessible: `https://ipfs.io/ipfs/<CID>`
3. Try re-uploading to IPFS with pinning

### Signature Verification Fails

**Symptom**: "Signing conditions not met. Refusing to sign."

**Solution**:
1. Check Lit Action logs for which condition failed:
   - OPA policy check
   - Tests check
   - PR merge check
2. Verify API endpoints are accessible from Lit Protocol nodes
3. Check GitHub token has required permissions

### OPA Policy Always Fails

**Symptom**: "OPA policy check FAILED"

**Solution**:
1. Test OPA policy manually:
   ```bash
   curl -X POST http://your-opa-server/v1/data/deployment/allow \
     -H "Content-Type: application/json" \
     -d '{"input": {"network": "sepolia", ...}}'
   ```
2. Verify OPA server is running and accessible
3. Check deployment config format matches policy expectations

## Next Steps

1. ✅ **Phase 2 Complete**: Lit Action Development
2. 🔄 **Phase 3**: CI/CD Integration (update `deploy.yml` workflow)
3. 🔄 **Phase 4**: PKP Setup Scripts (mint PKP, grant permissions, add to Safe)
4. 🔄 **Phase 5**: Testing & Documentation (E2E tests, troubleshooting guide)

## References

- [Lit Protocol Documentation](https://developer.litprotocol.com/)
- [Lit Actions Guide](https://developer.litprotocol.com/sdk/serverless-signing/overview)
- [PKP Overview](https://developer.litprotocol.com/integrations/aa/overview)
- [IPFS Documentation](https://docs.ipfs.io/)
- [OPA Policy Language](https://www.openpolicyagent.org/docs/latest/policy-language/)
