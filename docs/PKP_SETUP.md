# PKP Setup Guide

Complete guide for setting up Lit Protocol Programmable Key Pairs (PKPs) for automated signing in ZeroKeyCI.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Mint PKP NFT](#step-1-mint-pkp-nft)
4. [Step 2: Grant Lit Action Permission](#step-2-grant-lit-action-permission)
5. [Step 3: Add PKP to Safe](#step-3-add-pkp-to-safe)
6. [Step 4: Configure GitHub Secrets](#step-4-configure-github-secrets)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Overview

A Programmable Key Pair (PKP) is an NFT-controlled ECDSA key pair from Lit Protocol. The PKP's private key is distributed across Lit nodes using threshold cryptography, making it impossible for any single party to access. This allows for automated signing without ever exposing private keys.

### Architecture

```
┌─────────────────┐
│   PKP NFT       │  ← You own this
│   (Token ID)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Distributed Key │  ← Private key shares across Lit nodes
│   (ECDSA)       │     (never reconstructed)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lit Action     │  ← Conditional signing logic
│   (IPFS CID)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Safe Multisig  │  ← PKP as one of N owners
│   (Threshold)   │
└─────────────────┘
```

## Prerequisites

### Required

- **Node.js 18+** and **Bun** installed
- **Ethereum wallet** with funds for:
  - PKP minting gas (≈ $5-10 on mainnet, minimal on testnets)
  - Safe transaction gas (≈ $20-50 on mainnet, minimal on testnets)
- **Safe multisig wallet** with you as an owner
- **Lit Action deployed to IPFS** (see [LIT_ACTION_SETUP.md](./LIT_ACTION_SETUP.md))
- **ZeroKeyCI repository** cloned and dependencies installed

### Recommended

- **Testnet first**: Practice on Sepolia or other testnet before mainnet
- **バックアップ wallet**: Use a dedicated wallet for PKP ownership, not your main wallet
- **Multiple Safe owners**: 2-of-3 or 3-of-5 Safe for production

## Step 1: Mint PKP NFT

The first step is to mint a PKP NFT. The owner of this NFT controls the PKP's permissions.

### Interactive Setup

```bash
bun run scripts/setup/mint-pkp.ts
```

The script will prompt you for:

1. **Lit Network**: Choose your network
   - `datil-dev`: Development/testing (recommended for first setup)
   - `datil-test`: Testnet (for staging)
   - `datil`: Mainnet (for production)

2. **Ethereum Private Key**: The wallet that will own the PKP NFT
   - This wallet pays gas for minting
   - This wallet becomes the PKP owner
   - **Important**: Store the private key securely - it controls PKP permissions

### Environment Variables (Optional)

Skip interactive prompts by setting:

```bash
export LIT_NETWORK=datil-dev
export ETHEREUM_PRIVATE_KEY=0x<your-private-key>

bun run scripts/setup/mint-pkp.ts
```

### Output

The script creates `.zerokey/pkp-config.json`:

```json
{
  "tokenId": "0x1234...",
  "publicKey": "0x04abcd...",
  "ethAddress": "0x5678...",
  "network": "datil-dev",
  "mintedAt": "2025-10-18T07:00:00.000Z"
}
```

**Save this file!** It's needed for the next steps.

### What Happened

- ✅ PKP NFT minted on Lit Protocol
- ✅ ECDSA key pair generated and distributed across Lit nodes
- ✅ PKP Ethereum address derived (for use as Safe owner)
- ✅ Configuration saved to `.zerokey/pkp-config.json`

## Step 2: Grant Lit Action Permission

Grant your Lit Action permission to sign using the PKP.

### Prerequisites

- PKP minted (Step 1 complete)
- Lit Action deployed to IPFS (see [LIT_ACTION_SETUP.md](./LIT_ACTION_SETUP.md))

### Interactive Setup

```bash
bun run scripts/setup/grant-lit-action-permission.ts
```

The script will prompt you for:

1. **Lit Action IPFS CID**: The IPFS hash of your deployed Lit Action
   - Example: `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`
   - Get this from deploying the Lit Action (see docs/LIT_ACTION_SETUP.md)

2. **PKP Owner Private Key**: The same private key used in Step 1
   - Must be the owner of the PKP NFT
   - Used to authorize the Lit Action

### Environment Variables (Optional)

```bash
export LIT_ACTION_IPFS_CID=QmYour...IPFSHash
export ETHEREUM_PRIVATE_KEY=0x<pkp-owner-private-key>

bun run scripts/setup/grant-lit-action-permission.ts
```

### Output

Updates `.zerokey/pkp-config.json`:

```json
{
  "tokenId": "0x1234...",
  "publicKey": "0x04abcd...",
  "ethAddress": "0x5678...",
  "network": "datil-dev",
  "mintedAt": "2025-10-18T07:00:00.000Z",
  "litActionIpfsCid": "QmYour...IPFSHash",
  "permissionGrantedAt": "2025-10-18T07:05:00.000Z"
}
```

### What Happened

- ✅ Lit Action authorized to use PKP for signing
- ✅ PKP Permissions contract updated on-chain
- ✅ Lit Action can now request signatures from PKP
- ✅ Configuration updated with Lit Action CID

## Step 3: Add PKP to Safe

Add the PKP as an owner of your Safe multisig.

### Prerequisites

- PKP minted (Step 1 complete)
- Lit Action permission granted (Step 2 complete)
- You must be a current owner of the Safe
- Safe must have available owner slots

### Interactive Setup

```bash
bun run scripts/setup/add-pkp-to-safe.ts
```

The script will prompt you for:

1. **Safe Address**: Your Safe multisig wallet address
   - Example: `0x1234567890123456789012345678901234567890`

2. **Current Safe Owner Private Key**: Private key of an existing Safe owner
   - Used to propose the "add owner" transaction
   - Must be an owner with signing permissions

3. **New Threshold**: Safe signing threshold after adding PKP
   - Recommended: Keep current threshold or increase by 1
   - Example: 2-of-3 Safe with PKP → 2-of-4 (keep threshold at 2)

### Environment Variables (Optional)

```bash
export SAFE_ADDRESS=0x<your-safe-address>
export ETHEREUM_PRIVATE_KEY=0x<safe-owner-private-key>
export ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-api-key>

bun run scripts/setup/add-pkp-to-safe.ts
```

### Threshold Recommendations

| Current Safe | Recommended After PKP | Reasoning |
|--------------|----------------------|-----------|
| 1-of-1       | 1-of-2               | PKP can sign alone, but humans still have control |
| 2-of-2       | 2-of-3               | PKP + 1 human, or 2 humans (flexible) |
| 2-of-3       | 2-of-4               | PKP helps reach threshold faster |
| 3-of-5       | 3-of-6               | PKP as additional signer, doesn't change security model |

### Output

Final `.zerokey/pkp-config.json`:

```json
{
  "tokenId": "0x1234...",
  "publicKey": "0x04abcd...",
  "ethAddress": "0x5678...",
  "network": "datil-dev",
  "mintedAt": "2025-10-18T07:00:00.000Z",
  "litActionIpfsCid": "QmYour...IPFSHash",
  "permissionGrantedAt": "2025-10-18T07:05:00.000Z",
  "safeAddress": "0x<safe-address>",
  "safeThreshold": 2,
  "addedToSafeAt": "2025-10-18T07:10:00.000Z"
}
```

### What Happened

- ✅ PKP added as Safe owner
- ✅ Safe threshold updated (if changed)
- ✅ Other owners may need to approve (depending on current threshold)
- ✅ Configuration complete and saved

### Multi-Sig Approval

If your Safe threshold requires multiple signatures:

1. The "add owner" transaction is proposed but not executed
2. Other Safe owners need to sign via Safe UI
3. Once threshold is reached, transaction executes
4. PKP becomes an active owner

Check your Safe at:
- Mainnet: https://app.safe.global
- Sepolia: https://app.safe.global

## Step 4: Configure GitHub Secrets

Add the PKP configuration to your GitHub repository secrets.

### Required Secrets

Navigate to your repository: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `PKP_PUBLIC_KEY` | PKP Ethereum address | `0x5678...` |
| `LIT_ACTION_IPFS_CID` | Lit Action IPFS CID | `QmYour...IPFSHash` |
| `LIT_NETWORK` | Lit network name | `datil-dev` |
| `SAFE_ADDRESS` | Safe multisig address | `0x1234...` |

### Get Values from Config

```bash
# View your configuration
cat .zerokey/pkp-config.json

# Extract specific values
jq -r '.ethAddress' .zerokey/pkp-config.json        # PKP_PUBLIC_KEY
jq -r '.litActionIpfsCid' .zerokey/pkp-config.json  # LIT_ACTION_IPFS_CID
jq -r '.network' .zerokey/pkp-config.json           # LIT_NETWORK
jq -r '.safeAddress' .zerokey/pkp-config.json       # SAFE_ADDRESS
```

### Existing Secrets

These should already be configured:
- `SEPOLIA_RPC_URL` (or your network RPC)
- ~~`PRIVATE_KEY`~~ (NO LONGER NEEDED! 🎉)

**Important**: You can now remove `PRIVATE_KEY` from GitHub Secrets. The PKP replaces it entirely.

## Verification

### Check PKP Configuration

```bash
# View complete config
cat .zerokey/pkp-config.json

# Verify all fields are present
jq 'keys' .zerokey/pkp-config.json
# Should output:
# [
#   "addedToSafeAt",
#   "ethAddress",
#   "litActionIpfsCid",
#   "mintedAt",
#   "network",
#   "permissionGrantedAt",
#   "publicKey",
#   "safeAddress",
#   "safeThreshold",
#   "tokenId"
# ]
```

### Check Safe Owners

Visit your Safe:
- Mainnet: `https://app.safe.global/<chain>:<safe-address>`
- Sepolia: `https://app.safe.global/sep:<safe-address>`

Verify:
- ✅ PKP address appears in owners list
- ✅ Threshold is as expected
- ✅ All original owners still present

### Test Automated Signing

1. Create a test PR with `deploy` label
2. Merge the PR
3. Check GitHub Actions logs
4. Verify PKP signing step runs
5. Check Safe Transaction Service for proposed transaction

## Troubleshooting

### PKP Minting Fails

**Error**: `Insufficient funds`
- **Solution**: Ensure wallet has enough ETH for gas (≈ 0.01 ETH on testnet)

**Error**: `Failed to connect to Lit Protocol`
- **Solution**: Check network connection, try again, or use different Lit network

### Permission Granting Fails

**Error**: `Not PKP owner`
- **Solution**: Use the same private key that minted the PKP

**Error**: `Invalid IPFS CID`
- **Solution**: Deploy Lit Action to IPFS first (see LIT_ACTION_SETUP.md)

### Adding PKP to Safe Fails

**Error**: `Not a Safe owner`
- **Solution**: Use private key of existing Safe owner

**Error**: `Owner already exists`
- **Solution**: PKP is already a Safe owner, skip this step

**Error**: `Threshold too high`
- **Solution**: Choose threshold ≤ number of owners (including PKP)

### GitHub Actions PKP Signing Fails

**Error**: `PKP_PUBLIC_KEY not found`
- **Solution**: Add PKP_PUBLIC_KEY to GitHub Secrets (Step 4)

**Error**: `Lit Action validation failed`
- **Solution**: Check Lit Action conditions (OPA, tests, PR status)

**Error**: `PKP signature invalid`
- **Solution**: Verify PKP has permission for Lit Action (Step 2)

## Security Considerations

### Private Key Storage

- **PKP Owner Private Key**: Store securely (hardware wallet recommended)
- **Safe Owner Private Key**: Store securely (hardware wallet recommended)
- **Never commit private keys** to Git

### PKP NFT Ownership

- The PKP NFT owner controls all permissions
- If you lose the owner private key, you cannot update permissions
- Consider using a Safe to own the PKP NFT for multi-sig control

### Safe Configuration

- **Minimum 2-of-3**: Always have multiple human owners
- **Never 1-of-1 with PKP only**: Humans must retain control
- **Test on testnet first**: Practice full workflow before mainnet

### Lit Action Security

- **Code review**: Audit Lit Action code for vulnerabilities
- **IPFS pinning**: Ensure Lit Action remains available
- **Version control**: Track Lit Action changes in Git

## Next Steps

After completing PKP setup:

1. **Test deployment**: Create test PR with `deploy` label
2. **Monitor signing**: Check GitHub Actions logs for PKP signing
3. **Verify transactions**: Check Safe UI for proposed transactions
4. **Production deployment**: After successful testing, use on mainnet

## Resources

- [Lit Protocol Documentation](https://developer.litprotocol.com/)
- [Safe Documentation](https://docs.safe.global/)
- [ZeroKeyCI README](../README.md)
- [Lit Action Setup Guide](./LIT_ACTION_SETUP.md)

---

**Need help?** Open an issue on GitHub: https://github.com/susumutomita/ZeroKeyCI/issues
