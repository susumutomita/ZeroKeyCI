# Enabling PKP Signing in ZeroKeyCI-sample

This guide explains how to enable Lit Protocol PKP (Programmable Key Pairs) automated signing in the `ZeroKeyCI-sample` repository.

## Current Status

**❌ PKP signing is currently DISABLED**

Reason: GitHub Secrets are not configured in the ZeroKeyCI-sample repository.

Evidence from workflow logs:
```
[2025-10-26T10:24:32.894Z] INFO  📋 Manual workflow - Safe API submission skipped
```

The PKP signing step exists in the workflow (`.github/workflows/deploy.yml:226`) but is conditionally skipped:
```yaml
if: env.PKP_PUBLIC_KEY != '' && env.LIT_ACTION_IPFS_CID != ''
```

## Quick Fix

Add these 3 GitHub Secrets to the `susumutomita/ZeroKeyCI-sample` repository:

| Secret Name | Value | Source |
|------------|-------|---------|
| `PKP_PUBLIC_KEY` | `0x9CBC31d19108F622b13Ebcaa3906aEc45e1ADD44` | From `.zerokey/pkp-config.json` (ethAddress) |
| `LIT_ACTION_IPFS_CID` | `bafybeigfkfpdz5br6efhbkqwujfqkfndgcfgfebhmnpdiofvfi7ypxl25y` | From `.zerokey/pkp-config.json` (litActionIpfsCid) |
| `LIT_NETWORK` | `datil-test` | From `.zerokey/pkp-config.json` (network) |

## Step-by-Step Instructions

### 1. Navigate to Repository Settings

1. Go to https://github.com/susumutomita/ZeroKeyCI-sample
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)

### 2. Add PKP_PUBLIC_KEY Secret

1. Click **New repository secret**
2. Name: `PKP_PUBLIC_KEY`
3. Secret: `0x9CBC31d19108F622b13Ebcaa3906aEc45e1ADD44`
4. Click **Add secret**

### 3. Add LIT_ACTION_IPFS_CID Secret

1. Click **New repository secret**
2. Name: `LIT_ACTION_IPFS_CID`
3. Secret: `bafybeigfkfpdz5br6efhbkqwujfqkfndgcfgfebhmnpdiofvfi7ypxl25y`
4. Click **Add secret**

### 4. Add LIT_NETWORK Secret

1. Click **New repository secret**
2. Name: `LIT_NETWORK`
3. Secret: `datil-test`
4. Click **Add secret**

### 5. Verify Existing Secrets

Ensure these secrets are already configured:
- ✅ `SAFE_ADDRESS` = `0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663`
- ✅ `BASE_SEPOLIA_RPC_URL` (or using default)
- ⚠️  `SAFE_API_KEY` (optional but recommended for Safe API submission)

## Testing PKP Signing

After adding the secrets, trigger a new workflow run:

### Method 1: Manual Workflow Dispatch

1. Go to **Actions** tab
2. Select **Deploy Smart Contracts with ZeroKeyCI** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

### Method 2: Create Test PR

1. Create a new branch with a minor change
2. Open a pull request to `main`
3. Merge the PR
4. Workflow will auto-trigger

## Expected Workflow Output

When PKP signing is enabled, you should see:

```
🔐 Triggering Lit Protocol PKP signing...
✅ PKP signature obtained
  r: 0x1234...
  s: 0xabcd...
  v: 27
✅ Transaction submitted to Safe
  Safe Tx Hash: 0x...
```

## What PKP Signing Does

1. **Loads Safe proposal** from `safe-proposal.json`
2. **Validates with Lit Action** (OPA policies, tests, PR status)
3. **Signs transaction** using PKP private key (distributed across Lit nodes)
4. **Submits to Safe Transaction Service** with PKP signature
5. **Comments on PR** with signing status and Safe UI link

## Security Notes

**These secrets are safe to add because:**

- ✅ `PKP_PUBLIC_KEY` is a public address (like any Ethereum address)
- ✅ `LIT_ACTION_IPFS_CID` is a public IPFS hash
- ✅ `LIT_NETWORK` is a network identifier (public)

**The PKP private key is NEVER exposed:**

- Private key is distributed across Lit Protocol nodes (threshold cryptography)
- No single party can reconstruct the private key
- Signing happens on Lit nodes, never in GitHub Actions

**Safe multisig protection:**

- PKP is 1 of N owners in the Safe
- Threshold signatures still required for execution
- Safe owners retain full control

## Troubleshooting

### PKP Signing Still Skipped

**Check workflow logs:**
```bash
gh run view <RUN_ID> --log --repo susumutomita/ZeroKeyCI-sample | grep PKP
```

**Common issues:**

1. **Secrets not visible in logs?**
   - GitHub masks secret values in logs
   - Check for "PKP_PUBLIC_KEY" and "LIT_ACTION_IPFS_CID" in environment variables

2. **Condition still false?**
   - Verify secret names are EXACTLY: `PKP_PUBLIC_KEY`, `LIT_ACTION_IPFS_CID`
   - Secret names are case-sensitive

3. **Signing fails with Lit Protocol error?**
   - Check Lit Network status: https://developer.litprotocol.com/
   - Verify `LIT_NETWORK` matches PKP configuration (datil-test vs datil-dev)

### Viewing Current Secrets

You cannot view secret values after creation, but you can verify they exist:

1. Go to **Settings → Secrets and variables → Actions**
2. Check that all 3 secrets are listed:
   - PKP_PUBLIC_KEY
   - LIT_ACTION_IPFS_CID
   - LIT_NETWORK

## Next Steps

After enabling PKP signing:

1. ✅ Test deployment workflow
2. ✅ Monitor Safe UI for signed transactions
3. ✅ Approve and execute transactions in Safe
4. ✅ Verify contract deployment on Blockscout

## Related Documentation

- [PKP Setup Guide](./PKP_SETUP.md) - Complete PKP setup from scratch
- [ZeroKeyCI README](../README.md) - Main documentation
- [Lit Protocol Docs](https://developer.litprotocol.com/) - Lit Protocol details

---

**Need help?** Open an issue: https://github.com/susumutomita/ZeroKeyCI/issues
