# Quick Start: Deploy Your First Contract in 5 Minutes

**Complete beginner's guide from zero to your first deployed smart contract using ZeroKeyCI.**

> **What you'll learn:**
> - Create a Gnosis Safe wallet (no private keys in CI!)
> - Set up ZeroKeyCI in your GitHub repository
> - Deploy your first contract with multisig security

---

## 🚀 Two Ways to Get Started

### Option 1: Quick Try (Demo Mode) - 3 minutes ⚡

**Perfect for:** Learning the workflow, testing, hackathons

Use our demo Safe address to try ZeroKeyCI immediately:
- ✅ No Safe wallet creation needed
- ✅ Skip testnet ETH and RPC setup
- ✅ Understand the flow before production

**[→ Start with Demo Mode](./DEMO_MODE.md)** (Recommended for first-time users)

### Option 2: Full Setup (Production Ready) - 12 minutes 🔒

**Perfect for:** Production deployments, mainnet, real projects

Create your own Safe wallet for full security:
- ✅ Your own multisig wallet
- ✅ Production-ready security model
- ✅ Deploy to any network

**Continue below** for full setup instructions.

---

## 🎯 Prerequisites (2 minutes)

> **Note:** Using demo mode? Skip to [Demo Mode Guide](./DEMO_MODE.md) instead.

### Step 1: Create a Gnosis Safe Wallet

**Why?** ZeroKeyCI uses Gnosis Safe multisig for deployments. No private keys in CI/CD - ever.

1. **Visit [app.safe.global](https://app.safe.global)**
2. **Connect your wallet** (MetaMask, WalletConnect, etc.)
3. **Select network**: Choose **Sepolia** (testnet - free to use)
4. **Create Safe**:
   - Click "Create new Safe"
   - Choose "1/1" threshold (simplest for testing)
   - Click "Create"
   - Confirm transaction in your wallet
5. **Copy your Safe address**:
   - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0`
   - **Save this! You'll need it in Step 2.**

**Cost:** Free on Base Sepolia testnet (requires testnet ETH, see below)

> **Production tip:** For mainnet, use 2-of-3 or 3-of-5 threshold for better security. See [SAFE_SETUP.md](./SAFE_SETUP.md) for details.

### Step 2: Get Testnet ETH (1 minute)

Your Safe needs ETH to pay gas fees.

1. **Visit [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)** or [Base Network Faucets](https://docs.base.org/docs/tools/network-faucets/)
2. **Paste your Safe address** (from Step 1)
3. **Request ETH** (you'll get testnet ETH on Base Sepolia)
4. **Wait ~5 seconds** for transaction to confirm (Base is fast!)

### Step 3: Get RPC URL (1 minute)

ZeroKeyCI needs an RPC URL to communicate with the blockchain.

**Option A: Alchemy (Recommended)**
1. Visit [alchemy.com](https://www.alchemy.com)
2. Sign up (free tier: 300M requests/month)
3. Create App → Base Sepolia
4. Copy API Key
5. Your RPC URL: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Option B: Infura**
1. Visit [infura.io](https://www.infura.io)
2. Sign up (free tier: 100K requests/day)
3. Create Project → Web3 API → Base Sepolia
4. Copy Project ID
5. Your RPC URL: `https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID`

---

## 🚀 Setup ZeroKeyCI (3 minutes)

### Step 4: Add ZeroKeyCI Workflow to Your Repository

**Create the workflow file:**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Smart Contracts

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  deploy:
    if: github.event.pull_request.merged == true
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: base-sepolia
      contract-name: MyContract
      verify-blockscout: true
    secrets:
      rpc-url: ${{ secrets.BASE_SEPOLIA_RPC_URL }}
```

**What this does:**
- Triggers when you merge a PR to `main`
- Uses ZeroKeyCI to create a Safe deployment proposal
- NO private keys stored anywhere!

### Step 5: Configure GitHub Variables and Secrets

**Important:** GitHub has two types of settings:
- **Variables** (`vars.`) - Public info (Safe address, network)
- **Secrets** (`secrets.`) - Private info (RPC URLs, API keys)

#### Set SAFE_ADDRESS (Variable)

```bash
# Using GitHub CLI (recommended)
gh variable set SAFE_ADDRESS --body "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
```

**Or via GitHub UI:**
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click **Variables** tab
4. Click **New repository variable**
5. Name: `SAFE_ADDRESS`
6. Value: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0` (your Safe address from Step 1)
7. Click **Add variable**

#### Set BASE_SEPOLIA_RPC_URL (Secret)

```bash
# Using GitHub CLI (recommended)
gh secret set BASE_SEPOLIA_RPC_URL --body "https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
```

**Or via GitHub UI:**
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click **Secrets** tab
4. Click **New repository secret**
5. Name: `BASE_SEPOLIA_RPC_URL`
6. Value: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY` (your RPC URL from Step 3)
7. Click **Add secret**

### Step 6: Verify Configuration

**Check variables and secrets are set:**

```bash
# List variables
gh variable list

# List secrets
gh secret list
```

You should see:
```
SAFE_ADDRESS           updated 1m ago
BASE_SEPOLIA_RPC_URL   updated 1m ago
```

---

## 📝 Deploy Your First Contract

### Step 7: Create a Simple Contract

Create `contracts/MyContract.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyContract {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function setMessage(string memory _message) public {
        message = _message;
    }
}
```

### Step 8: Open Pull Request

```bash
git add .github/workflows/deploy.yml contracts/MyContract.sol
git commit -m "feat: add MyContract and ZeroKeyCI deployment"
git push origin main
```

**Or create a branch and PR:**

```bash
git checkout -b feat/add-my-contract
git add .github/workflows/deploy.yml contracts/MyContract.sol
git commit -m "feat: add MyContract and ZeroKeyCI deployment"
git push -u origin feat/add-my-contract

# Create PR via GitHub CLI
gh pr create --title "Deploy MyContract" --body "Deploy first contract using ZeroKeyCI"
```

### Step 9: Merge PR and Review Proposal

1. **Merge the PR** on GitHub
2. **GitHub Actions runs** (watch in Actions tab)
3. **Safe proposal created** - Check PR comments for:
   - Deployment address (predicted)
   - Gas cost estimate
   - Link to Safe UI for signing

### Step 10: Sign and Execute Deployment

1. **Open Safe UI**: Click link in PR comment or visit [app.safe.global](https://app.safe.global)
2. **Review transaction**:
   - Contract bytecode
   - Constructor arguments
   - Gas estimate
3. **Sign with your wallet** (threshold signatures required)
4. **Execute** → Contract deployed! 🎉

---

## ✅ Success! What Just Happened?

**Traditional CI/CD:**
```
❌ PR Merge → CI reads PRIVATE_KEY from secrets → Signs → Deploys
   (Risk: Anyone with repo access can steal key)
```

**ZeroKeyCI:**
```
✅ PR Merge → CI creates proposal → Safe owners review → Sign → Deploy
   (Security: No keys in CI, multisig required)
```

**What you achieved:**
- ✅ Deployed smart contract WITHOUT private keys in CI
- ✅ Multisig security (Safe threshold signatures)
- ✅ Complete audit trail (PR → CI logs → Safe → Blockchain)
- ✅ Gas optimization recommendations
- ✅ Automated contract verification

---

## 🎓 Next Steps

### Advanced Configuration (Optional)

#### Option: Use `.zerokey/deploy.yaml` Configuration File

**What is it?** An optional configuration file for centralizing deployment settings.

**When to use it:**
- ✅ You have multiple contracts to deploy
- ✅ You want to share configuration across workflows
- ✅ You prefer file-based configuration over workflow YAML

**When NOT to use it:**
- ⛔ Simple projects with one contract (use workflow parameters instead - easier)
- ⛔ Quick start guide examples (workflow parameters are clearer)

**How to use:**

1. Create `.zerokey/deploy.yaml` in your repository root:

```yaml
network: base-sepolia
contract: MyContract
```

2. The workflow will use these values automatically if **not** specified in workflow inputs.

**Priority:** Workflow inputs **always override** file configuration.

```yaml
# .github/workflows/deploy.yml
with:
  safe-address: ${{ vars.SAFE_ADDRESS }}
  # network and contract-name can be omitted if .zerokey/deploy.yaml exists
  verify-blockscout: true
secrets:
  rpc-url: ${{ secrets.BASE_SEPOLIA_RPC_URL }}
```

**Example use case:** Multi-contract repository

```yaml
# .zerokey/deploy.yaml
network: base-sepolia
contract: TokenContract  # Default contract

# Override in workflow for different contracts:
# .github/workflows/deploy-nft.yml
with:
  contract-name: NFTContract  # Overrides file setting
```

### Deploy to More Networks

Update `.github/workflows/deploy.yml`:

```yaml
with:
  safe-address: ${{ vars.SAFE_ADDRESS }}
  network: polygon  # or arbitrum, optimism, base, etc.
  contract-name: MyContract
```

Add network-specific RPC URLs:

```bash
gh secret set POLYGON_RPC_URL --body "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"
```

### Add Upgradeable Contracts (UUPS)

See [UPGRADEABLE_CONTRACTS.md](./UPGRADEABLE_CONTRACTS.md) for:
- UUPS proxy deployment
- Transparent proxy deployment
- Safe upgrade workflows

### Enable Automated Signing (Optional)

For high-frequency deployments, add Lit Protocol PKP:

See [PKP_SETUP.md](./PKP_SETUP.md) for automated conditional signing.

### Production Deployment

Before mainnet:
1. Create new Safe with 2-of-3 or 3-of-5 threshold
2. Add mainnet RPC URL as secret
3. Update workflow to use mainnet Safe address
4. Test thoroughly on testnet first!

See [SAFE_SETUP.md](./SAFE_SETUP.md) for production security best practices.

---

## 🆘 Troubleshooting

### "Safe address not found"

**Cause:** Safe address not set as GitHub Variable

**Fix:**
```bash
gh variable set SAFE_ADDRESS --body "0xYourSafeAddress"
```

### "Invalid RPC URL"

**Cause:** RPC URL not set or incorrect format

**Fix:**
```bash
# Must include full URL with API key
gh secret set BASE_SEPOLIA_RPC_URL --body "https://base-sepolia.g.alchemy.com/v2/YOUR_KEY"
```

### "Insufficient funds for gas"

**Cause:** Safe has no ETH

**Fix:** Send testnet ETH to your Safe address using [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)

### "Contract compilation failed"

**Cause:** Solidity syntax error or missing dependencies

**Fix:**
```bash
# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Compile locally to test
npx hardhat compile
```

### Still stuck?

- 📖 [Full Documentation](../README.md)
- 🔧 [Integration Guide](./INTEGRATION_GUIDE.md)
- 🛡️ [Security Model](./SECURITY.md)
- 💬 [GitHub Issues](https://github.com/susumutomita/ZeroKeyCI/issues)

---

## 📚 Learn More

### Core Concepts

- **[How It Works](./HOW_IT_WORKS.md)** - Technical architecture
- **[Security Model](./SECURITY.md)** - Why this is secure
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Advanced integration options

### Advanced Features

- **[Upgradeable Contracts](./UPGRADEABLE_CONTRACTS.md)** - UUPS & Transparent proxies
- **[PKP Setup](./PKP_SETUP.md)** - Automated conditional signing
- **[Gas Optimization](./GAS_OPTIMIZATION.md)** - Save on deployment costs

### Reference

- **[Safe Setup](./SAFE_SETUP.md)** - Complete Safe wallet guide
- **[GitHub Integration](./GITHUB_INTEGRATION.md)** - One-click repository setup
- **[API Reference](./API.md)** - Workflow parameters

---

**Built for ETHOnline 2025** | [GitHub](https://github.com/susumutomita/ZeroKeyCI) | [Demo](https://zero-key-ci.vercel.app)
