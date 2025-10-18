# ZeroKeyCI Production Deployment Guide

Complete guide for deploying ZeroKeyCI to production with Lit Protocol PKP automated signing.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Option A: Manual Safe Signing](#option-a-manual-safe-signing)
5. [Option B: Lit Protocol PKP Automated Signing](#option-b-lit-protocol-pkp-automated-signing)
6. [Network Configuration](#network-configuration)
7. [CI/CD Setup](#cicd-setup)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Overview

ZeroKeyCI provides two deployment modes:

1. **Manual Safe Signing** (Recommended for starting): CI creates proposals, humans sign via Safe UI
2. **Lit Protocol PKP Automated Signing** (Advanced): CI triggers automated conditional signing

Both modes maintain the core security principle: **NO private keys in GitHub Actions**.

## Prerequisites

### Required

- **GitHub Repository**: Your smart contract project
- **Gnosis Safe Multisig**: Deployed on your target network
- **Safe Owner Access**: You must be a current owner
- **RPC Endpoint**: Alchemy, Infura, or custom node
- **Bun Runtime**: v1.0+ for running setup scripts

### Recommended

- **Hardware Wallet**: For Safe owner key management
- **Testnet First**: Practice full workflow on Sepolia or other testnet
- **Multiple Owners**: 2-of-3 or 3-of-5 Safe configuration

## Deployment Options

### Option A: Manual Safe Signing

**Best for**:
- Getting started with ZeroKeyCI
- Teams that prefer manual approval for all deployments
- Maximum control and auditability

**How it works**:
```
PR Merged → CI Creates Safe Proposal → Owners Sign via Safe UI → Transaction Executes
```

**Setup**: [Skip to Option A Instructions](#option-a-manual-safe-signing)

### Option B: Lit Protocol PKP Automated Signing

**Best for**:
- High-frequency deployments
- Automated signing with conditional logic
- Advanced teams comfortable with threshold cryptography

**How it works**:
```
PR Merged → CI Creates Proposal → Lit Action Validates → PKP Signs → Transaction to Safe
```

**Setup**: [Go to Option B Instructions](#option-b-lit-protocol-pkp-automated-signing)

## Option A: Manual Safe Signing

### Step 1: Create Gnosis Safe

If you don't have a Safe yet:

1. Go to [Safe UI](https://app.safe.global)
2. Click "Create Safe"
3. Add owner addresses (recommend 2-3 owners minimum)
4. Set threshold (e.g., 2-of-3)
5. Deploy Safe
6. Save your Safe address

### Step 2: Configure GitHub Repository

Navigate to: **Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SAFE_ADDRESS` | Your Safe multisig address | `0x1234...abcd` |
| `SEPOLIA_RPC_URL` | RPC endpoint for Sepolia | `https://eth-sepolia.g.alchemy.com/v2/...` |
| `MAINNET_RPC_URL` | RPC endpoint for Mainnet | `https://eth-mainnet.g.alchemy.com/v2/...` |

**Optional secrets** (for OPA policy validation):

| Secret Name | Purpose |
|-------------|---------|
| `GITHUB_TOKEN` | Automatically provided |
| `OPA_POLICY_PATH` | Custom policy path (default: `opa/policies/`) |

### Step 3: Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy with ZeroKeyCI

on:
  pull_request:
    types: [closed]
    branches:
      - main

jobs:
  deploy:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run ZeroKeyCI
        env:
          SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
          SEPOLIA_RPC_URL: ${{ secrets.SEPOLIA_RPC_URL }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Compile contracts
          bunx hardhat compile

          # Run tests
          bun run test

          # Validate with OPA
          bun run opa:validate

          # Create Safe proposal
          bun run build-proposal

      - name: Upload proposal artifact
        uses: actions/upload-artifact@v4
        with:
          name: safe-proposal
          path: safe-proposal.json

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Safe proposal created! Sign at https://app.safe.global'
            })
```

### Step 4: Deploy

1. Create a PR with contract changes
2. Get PR approved and merge
3. CI creates Safe proposal
4. Go to [Safe UI](https://app.safe.global)
5. Connect your wallet
6. Sign the transaction
7. Execute once threshold is reached

**Done!** You're now using ZeroKeyCI with manual signing.

## Option B: Lit Protocol PKP Automated Signing

### Prerequisites

- Completed [Option A setup](#option-a-manual-safe-signing)
- Read [PKP_SETUP.md](./docs/PKP_SETUP.md)
- **CRITICAL**: Test on testnet first

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
│                                                              │
│  1. Compile contracts                                        │
│  2. Run tests                                                │
│  3. Validate with OPA policies                              │
│  4. Create Safe transaction proposal                         │
│  5. ✨ NEW: Trigger Lit Protocol PKP signing                │
│                                                              │
│  ❌ STILL NO PRIVATE KEYS                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
              [Safe Proposal + PKP Request]
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Lit Protocol Network                      │
│                                                              │
│  Lit Action (JavaScript executed on Lit nodes):             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ if (allTestsPass &&                                  │   │
│  │     opaPolicyValid &&                                │   │
│  │     prApproved &&                                    │   │
│  │     from === 'github-actions') {                     │   │
│  │   sign(transaction);  // PKP signs automatically     │   │
│  │ } else {                                             │   │
│  │   reject('Validation failed');                       │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  PKP (Distributed Key):                                     │
│  - Private key NEVER reconstructed                           │
│  - Threshold cryptography across Lit nodes                   │
│  - Controlled by NFT ownership                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    [PKP Signature]
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Gnosis Safe Multisig                      │
│                                                              │
│  Transaction proposed with PKP signature                     │
│  Other owners can still review and override                  │
│                                                              │
│  Threshold: e.g., 2-of-3 (PKP + 1 human, or 2 humans)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    [Execute On-Chain]
```

### Step 1: Deploy Lit Action

See [LIT_ACTION_SETUP.md](./docs/LIT_ACTION_SETUP.md) for deploying your Lit Action to IPFS.

**Quick summary**:

```bash
# Install dependencies
bun install @lit-protocol/lit-node-client

# Deploy Lit Action
bun run scripts/deploy-lit-action.ts

# Save the IPFS CID that's output
# Example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
```

### Step 2: Mint PKP NFT

```bash
# Mint PKP
bun run scripts/setup/mint-pkp.ts

# Follow prompts:
# - Select network (datil-dev for testnet, datil for mainnet)
# - Enter private key (to pay gas for minting)
# - PKP config saved to .zerokey/pkp-config.json
```

**Output**:
```json
{
  "tokenId": "0x1234...",
  "publicKey": "0x04abcd...",
  "ethAddress": "0x5678...",
  "network": "datil-dev",
  "mintedAt": "2025-10-18T07:00:00.000Z"
}
```

**Important**: Save `.zerokey/pkp-config.json` securely. You'll need it for next steps.

### Step 3: Grant Lit Action Permission

```bash
# Grant permission
bun run scripts/setup/grant-lit-action-permission.ts

# Follow prompts:
# - Enter Lit Action IPFS CID (from Step 1)
# - Enter PKP owner private key
```

This authorizes your Lit Action to sign using the PKP.

### Step 4: Add PKP to Safe

```bash
# Add PKP as Safe owner
bun run scripts/setup/add-pkp-to-safe.ts

# Follow prompts:
# - Enter Safe address
# - Enter current Safe owner private key
# - Choose new threshold
```

**Threshold recommendations**:

| Current Safe | Recommended After PKP | Reasoning |
|--------------|----------------------|-----------|\n| 1-of-1       | 1-of-2               | PKP can sign alone, humans retain control |
| 2-of-2       | 2-of-3               | PKP + 1 human, or 2 humans (flexible) |
| 2-of-3       | 2-of-4               | PKP helps reach threshold faster |
| 3-of-5       | 3-of-6               | PKP as additional signer |

**Important**: If your Safe threshold requires multiple signatures, other owners must approve the "add owner" transaction in the Safe UI before the PKP becomes active.

### Step 5: Configure GitHub Secrets

Add these additional secrets to GitHub:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `PKP_PUBLIC_KEY` | PKP Ethereum address | `.zerokey/pkp-config.json → ethAddress` |
| `LIT_ACTION_IPFS_CID` | Lit Action IPFS hash | Output from Step 1 |
| `LIT_NETWORK` | Lit network name | `datil-dev` (testnet) or `datil` (mainnet) |

**Extract values**:

```bash
# View config
cat .zerokey/pkp-config.json

# Extract specific values
jq -r '.ethAddress' .zerokey/pkp-config.json         # PKP_PUBLIC_KEY
jq -r '.litActionIpfsCid' .zerokey/pkp-config.json   # LIT_ACTION_IPFS_CID
jq -r '.network' .zerokey/pkp-config.json            # LIT_NETWORK
```

### Step 6: Update Workflow

Update `.github/workflows/deploy.yml` to trigger PKP signing:

```yaml
- name: Trigger PKP signing (if configured)
  id: pkp-signing
  if: env.PKP_PUBLIC_KEY != '' && env.LIT_ACTION_IPFS_CID != ''
  env:
    PKP_PUBLIC_KEY: ${{ secrets.PKP_PUBLIC_KEY }}
    LIT_ACTION_IPFS_CID: ${{ secrets.LIT_ACTION_IPFS_CID }}
    LIT_NETWORK: ${{ secrets.LIT_NETWORK || 'datil-dev' }}
    SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    GITHUB_PR_NUMBER: ${{ github.event.pull_request.number }}
  run: |
    bun run scripts/trigger-pkp-signing.ts safe-proposal.json

- name: Comment on PR with PKP status
  if: steps.pkp-signing.outcome != 'skipped'
  uses: actions/github-script@v7
  with:
    script: |
      const status = '${{ steps.pkp-signing.outcome }}' === 'success'
        ? '✅ PKP signed and submitted to Safe!'
        : '❌ PKP signing failed - check logs';
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: status
      })
```

### Step 7: Test Deployment

1. Create test PR with small contract change
2. Merge PR
3. Watch GitHub Actions logs:
   - Compile ✓
   - Tests ✓
   - OPA validation ✓
   - PKP signing ✓
4. Check Safe UI for proposed transaction
5. Verify PKP signature is present

**Done!** You're now using automated PKP signing.

## Network Configuration

### Supported Networks

| Network | Chain ID | RPC Secret Name | Safe UI |
|---------|----------|-----------------|---------|
| Ethereum Mainnet | 1 | `MAINNET_RPC_URL` | [app.safe.global](https://app.safe.global) |
| Sepolia | 11155111 | `SEPOLIA_RPC_URL` | [app.safe.global](https://app.safe.global) |
| Polygon | 137 | `POLYGON_RPC_URL` | [app.safe.global](https://app.safe.global) |
| Optimism | 10 | `OPTIMISM_RPC_URL` | [app.safe.global](https://app.safe.global) |
| Arbitrum | 42161 | `ARBITRUM_RPC_URL` | [app.safe.global](https://app.safe.global) |
| Base | 8453 | `BASE_RPC_URL` | [app.safe.global](https://app.safe.global) |

### RPC Providers

**Recommended**:
- [Alchemy](https://www.alchemy.com/) - Free tier: 300M compute units/month
- [Infura](https://infura.io/) - Free tier: 100k requests/day
- [QuickNode](https://www.quicknode.com/) - Free trial available

**Setup**:
1. Create account with provider
2. Create API key for your network
3. Add to GitHub Secrets as `<NETWORK>_RPC_URL`

## CI/CD Setup

### GitHub Actions

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- PR merged to `main` branch
- Manual workflow dispatch (optional)

**Steps**:
1. Checkout code
2. Install dependencies
3. Compile contracts
4. Run tests
5. Validate with OPA
6. Create Safe proposal
7. (Optional) Trigger PKP signing

**Artifacts**:
- `safe-proposal.json`: Safe transaction proposal
- Test coverage reports
- Compilation artifacts

### Other CI Platforms

ZeroKeyCI can work with any CI/CD platform. Key requirements:

1. Bun runtime available
2. Can set environment variables/secrets
3. Can upload artifacts
4. Can call scripts

**Adaptation**:
- GitLab CI: Use `.gitlab-ci.yml`
- CircleCI: Use `.circleci/config.yml`
- Jenkins: Use `Jenkinsfile`

## Post-Deployment Verification

### Checklist

- [ ] Safe transaction proposed successfully
- [ ] All CI checks passed (tests, OPA, compilation)
- [ ] Safe owners received notification
- [ ] (PKP mode) PKP signature present
- [ ] Transaction details match PR changes
- [ ] No private keys in logs or artifacts

### Verification Commands

```bash
# Check Safe transaction count
cast call $SAFE_ADDRESS "nonce()(uint256)" --rpc-url $RPC_URL

# View Safe owners
cast call $SAFE_ADDRESS "getOwners()(address[])" --rpc-url $RPC_URL

# Check Safe threshold
cast call $SAFE_ADDRESS "getThreshold()(uint256)" --rpc-url $RPC_URL
```

### Monitoring

**Safe Transaction Service**:
- View pending transactions
- Check signature status
- See execution history

**GitHub Actions**:
- Check workflow runs
- View logs for errors
- Monitor artifact uploads

## Security Considerations

### Critical Rules

1. **NEVER commit private keys** to Git
2. **NEVER log private keys** in CI output
3. **ALWAYS use GitHub Secrets** for sensitive data
4. **ALWAYS test on testnet first**
5. **ALWAYS maintain multiple Safe owners**

### PKP Security

- **PKP NFT ownership**: Controls all permissions
- **Lit Action code**: Audit thoroughly, version control
- **IPFS pinning**: Ensure Lit Action remains available
- **Network selection**: Test on datil-dev before datil (mainnet)

### Safe Security

- **Minimum 2-of-3**: Never use 1-of-1 in production
- **Hardware wallets**: For owner key management
- **Owner rotation**: Regular audit of owners
- **Threshold review**: Ensure appropriate for your use case

### CI/CD Security

- **Branch protection**: Require PR reviews before merge
- **Status checks**: Require tests and OPA to pass
- **Secrets rotation**: Regular rotation of RPC keys
- **Audit logs**: Review GitHub Actions logs

## Troubleshooting

### Common Issues

#### "Safe proposal creation failed"

**Symptoms**: CI fails at proposal creation step

**Causes**:
- Invalid Safe address
- RPC endpoint down or rate-limited
- Contract compilation failed

**Solutions**:
```bash
# Verify Safe address
cast call $SAFE_ADDRESS "VERSION()(string)" --rpc-url $RPC_URL

# Test RPC connection
curl -X POST $RPC_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check contract artifacts
ls -la artifacts/
```

#### "PKP signing failed"

**Symptoms**: Lit Action validation fails

**Causes**:
- Tests didn't pass
- OPA policy rejected
- PR not properly approved
- Lit network connectivity

**Solutions**:
```bash
# Check test results
bun run test

# Validate OPA locally
bun run opa:validate

# Verify PKP config
cat .zerokey/pkp-config.json

# Test Lit connection
curl https://api.litprotocol.com/health
```

#### "GitHub Secrets not found"

**Symptoms**: `Error: SAFE_ADDRESS is not set`

**Solutions**:
1. Go to Repository → Settings → Secrets and variables → Actions
2. Verify secret name exactly matches (case-sensitive)
3. Check repository vs organization secrets scope
4. Ensure secrets are available to workflow file

### Getting Help

- **Documentation**: [README.md](./README.md), [PKP_SETUP.md](./docs/PKP_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/susumutomita/ZeroKeyCI/issues)
- **Lit Protocol**: [Lit Docs](https://developer.litprotocol.com/)
- **Safe**: [Safe Docs](https://docs.safe.global/)

### Debug Mode

Enable verbose logging:

```yaml
# In .github/workflows/deploy.yml
env:
  DEBUG: "true"
  LOG_LEVEL: "debug"
```

## Next Steps

After successful deployment:

1. **Monitor first deployment**: Watch full cycle end-to-end
2. **Document your workflow**: Add team-specific notes
3. **Train team members**: Ensure everyone knows the process
4. **Set up alerts**: GitHub Actions notifications
5. **Regular audits**: Review Safe owners, PKP permissions quarterly

## Resources

- [ZeroKeyCI README](./README.md)
- [PKP Setup Guide](./docs/PKP_SETUP.md)
- [Lit Action Setup](./docs/LIT_ACTION_SETUP.md)
- [Integration Guide](./docs/INTEGRATION_GUIDE.md)
- [Security Architecture](./docs/SECURITY.md)

---

**Need help?** Open an issue: https://github.com/susumutomita/ZeroKeyCI/issues
