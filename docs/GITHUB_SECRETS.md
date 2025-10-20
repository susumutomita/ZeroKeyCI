# GitHub Secrets Configuration

This guide explains how to configure GitHub Secrets for ZeroKeyCI deployment workflows.

## 📋 Overview

GitHub Secrets are used to store sensitive configuration values securely. ZeroKeyCI uses secrets for:
- Safe multisig wallet addresses
- RPC provider API keys
- Lit Protocol PKP configuration (optional)
- Notification webhooks (optional)

## 🔐 Required Secrets

### SAFE_ADDRESS
**Required**: Yes
**Description**: Your Gnosis Safe multisig wallet address
**Example**: `0x742D35CC6634c0532925A3b844BC9E7595F0BEb0`

```bash
# How to set:
gh secret set SAFE_ADDRESS --body "0x742D35CC6634c0532925A3b844BC9E7595F0BEb0"
```

**Validation**: Must be a valid Ethereum address (42 characters, starts with `0x`)

---

## 🌐 Network RPC URLs

### SEPOLIA_RPC_URL
**Required**: Recommended for testnet deployments
**Description**: RPC endpoint for Ethereum Sepolia testnet
**Get from**: [Alchemy](https://www.alchemy.com/), [Infura](https://infura.io/), [QuickNode](https://www.quicknode.com/)

```bash
gh secret set SEPOLIA_RPC_URL --body "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
```

### MAINNET_RPC_URL
**Required**: For mainnet deployments
**Description**: RPC endpoint for Ethereum mainnet

```bash
gh secret set MAINNET_RPC_URL --body "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
```

### POLYGON_RPC_URL
**Required**: For Polygon deployments
**Description**: RPC endpoint for Polygon network

```bash
gh secret set POLYGON_RPC_URL --body "https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
```

### ARBITRUM_RPC_URL
**Required**: For Arbitrum deployments
**Description**: RPC endpoint for Arbitrum network

```bash
gh secret set ARBITRUM_RPC_URL --body "https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
```

### OPTIMISM_RPC_URL
**Required**: For Optimism deployments
**Description**: RPC endpoint for Optimism network

```bash
gh secret set OPTIMISM_RPC_URL --body "https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
```

### BASE_RPC_URL
**Required**: For Base deployments
**Description**: RPC endpoint for Base network

```bash
gh secret set BASE_RPC_URL --body "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
```

---

## 🔐 Lit Protocol PKP (Optional - for automated signing)

### PKP_PUBLIC_KEY
**Required**: No (only for automated signing)
**Description**: Public key of your Programmable Key Pair
**How to get**: Run `bun run scripts/setup/mint-pkp.ts`

```bash
gh secret set PKP_PUBLIC_KEY --body "0x04..."
```

### LIT_ACTION_IPFS_CID
**Required**: No (only for automated signing)
**Description**: IPFS CID of your Lit Action code
**How to get**: Upload via Lit SDK or scripts

```bash
gh secret set LIT_ACTION_IPFS_CID --body "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
```

### LIT_NETWORK
**Required**: No
**Description**: Lit Protocol network to use
**Options**: `datil-dev`, `datil-test`, `datil`
**Default**: `datil-dev`

```bash
gh secret set LIT_NETWORK --body "datil-dev"
```

---

## 📨 Notifications (Optional)

ZeroKeyCI can send deployment notifications to multiple channels: GitHub PR comments (automatic), Slack, and Discord. Webhook notifications are optional and non-blocking - deployment will continue even if webhook delivery fails.

### SLACK_WebHOOK_URL
**Required**: No
**Description**: Slack webhook URL for deployment notifications
**How to get**:
1. Go to your Slack workspace
2. Navigate to **Apps** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Select channel for notifications (e.g., `#deployments`)
5. Copy the webhook URL

```bash
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Notification Format**:
- Deployment started/completed/failed status
- Contract name and network
- Deployment ID and Safe address
- Gas cost estimates
- Error details (if failed)

### DISCORD_WebHOOK_URL
**Required**: No
**Description**: Discord webhook URL for deployment notifications
**How to get**:
1. Open Discord server settings
2. Go to **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Configure webhook:
   - Name: `ZeroKeyCI`
   - Channel: Select channel (e.g., `#deployments`)
5. Click **Copy Webhook URL**

```bash
gh secret set DISCORD_WEBHOOK_URL --body "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
```

**Notification Format**:
- Deployment status updates
- Contract details and network info
- Gas analysis results
- Safe proposal links

**Note**: You can configure one, both, or neither webhook. GitHub PR comments are always sent automatically.

---

## ⚡ Quick Setup

### Using GitHub CLI

```bash
# Required: Set your Safe address
gh secret set SAFE_ADDRESS --body "0xYourSafeAddress"

# Recommended: Set RPC URL for your network
gh secret set SEPOLIA_RPC_URL --body "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"

# Optional: Lit Protocol for automated signing
gh secret set PKP_PUBLIC_KEY --body "0x04..."
gh secret set LIT_ACTION_IPFS_CID --body "QmYour..."
gh secret set LIT_NETWORK --body "datil-dev"
```

### Using GitHub Web UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

---

## ✅ Verification

After setting secrets, verify they're configured correctly:

```bash
# List all configured secrets (values are hidden)
gh secret list

# Expected output:
# SAFE_ADDRESS       Updated 2025-10-18
# SEPOLIA_RPC_URL    Updated 2025-10-18
# PKP_PUBLIC_KEY     Updated 2025-10-18
```

---

## 🔒 Security Best Practices

### ✅ DO

- **Use GitHub Secrets** for all sensitive values
- **Rotate RPC API keys** periodically
- **Use dedicated API keys** for CI/CD (not personal keys)
- **Enable 2FA** on your GitHub account
- **Audit secret access** regularly
- **Use different Safes** for testnet vs mainnet

### ❌ DON'T

- **Never commit** `.env` files with real values
- **Never log** secret values in workflows
- **Never share** secrets in PR comments
- **Never use** production keys in development
- **Never store** private keys in GitHub Secrets (use PKPs instead!)

---

## 🚨 If Secrets Are Compromised

### Immediate Actions

1. **Revoke the compromised secret** immediately
2. **Generate new keys/addresses**
3. **Update GitHub Secrets** with new values
4. **Audit recent activity** on affected accounts
5. **Review Safe transaction history**

### For RPC API Keys

- Revoke in provider dashboard (Alchemy/Infura)
- Generate new key
- Update secret

### For PKP

- PKPs cannot be compromised (no exportable private key)
- Revoke Lit Action permissions if needed
- Generate new PKP if concerned

### For Safe Address

- Safe addresses are public (not secret)
- Review Safe transaction history
- Check Safe owners and threshold

---

## 📖 Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [PKP Setup Guide](./PKP_SETUP.md)
- [Security Guide](./SECURITY.md)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🆘 Troubleshooting

### "SAFE_ADDRESS not found" error

```bash
# Verify secret is set
gh secret list | grep SAFE_ADDRESS

# If not found, set it:
gh secret set SAFE_ADDRESS --body "0xYourAddress"
```

### "Invalid RPC URL" error

```bash
# Test RPC URL locally
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_RPC_URL

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

### "PKP signature failed" error

```bash
# Verify PKP configuration
gh secret list | grep PKP
gh secret list | grep LIT

# Ensure all three are set:
# - PKP_PUBLIC_KEY
# - LIT_ACTION_IPFS_CID
# - LIT_NETWORK (optional)
```

---

**Next Steps**: Once secrets are configured, proceed to [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.
