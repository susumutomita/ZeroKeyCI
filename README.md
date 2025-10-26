![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/susumutomita/ZeroKeyCI)
![GitHub top language](https://img.shields.io/github/languages/top/susumutomita/ZeroKeyCI)
![GitHub pull requests](https://img.shields.io/github/issues-pr/susumutomita/ZeroKeyCI)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/susumutomita/ZeroKeyCI)
![GitHub repo size](https://img.shields.io/github/repo-size/susumutomita/ZeroKeyCI)
[![ci](https://github.com/susumutomita/ZeroKeyCI/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/susumutomita/ZeroKeyCI/actions/workflows/ci.yml)

# 🛠 ZeroKey CI

**Key-less CI/CD for smart contracts — secure, auditable, and open.**

> ETHOnline 2025 submission
> [Demo → https://zero-key-ci.vercel.app](https://zero-key-ci.vercel.app)

**🚀 [Quick Start Guide](docs/QUICKSTART.md) - Deploy your first contract in 5 minutes**

**⚡ NEW: [Demo Mode](docs/DEMO_MODE.md) - Try ZeroKeyCI in 3 minutes (no Safe setup required!)**

## [DeepWiki](https://deepwiki.com/susumutomita/ZeroKeyCI/1-overview)

## 🏆 ETHOnline 2025 - What Makes This Different

**The Problem**: Every Web3 team faces the same dilemma - deploy fast with keys in CI (insecure), or deploy manually (slow, error-prone).

**ZeroKeyCI's Solution**: Deploy smart contracts through GitHub Actions **without storing private keys anywhere**. Gnosis Safe multisig owners approve deployments - no keys in code, no keys in secrets, no keys in CI.

### 💡 Real-World Impact

**Before ZeroKeyCI:**

- 🔴 Private keys in GitHub Secrets → stolen in SolarWinds-style breach
- 🔴 Manual deployments → 30+ minutes per release, human error
- 🔴 No cost visibility → surprise $200 gas fees on mainnet
- 🔴 Upgrade risks → proxy deployment mistakes break contracts

**After ZeroKeyCI:**

- ✅ Zero keys in CI → impossible to steal what doesn't exist
- ✅ Automated deployments → 3 minutes from PR merge to Safe proposal
- ✅ Gas optimization → automatic recommendations save $50-200 per deployment
- ✅ Safe upgrades → UUPS/Transparent proxy support with validation

### 🚀 What We Built for ETHOnline 2025

**1. Automatic Gas Optimization** → Save money on every deployment

- Real-time gas prices across 10 networks
- Multi-network cost comparison: "Deploy on Polygon saves $45"
- 6 types of optimization recommendations (timing, network selection, bytecode)
- Integrated into every CI/CD run - no manual work

**2. True Multi-Chain Support** → Deploy everywhere with one config

- 10 networks: Ethereum, Polygon, Arbitrum, Optimism, Base (+ all testnets)
- Single YAML file deploys to all networks
- Deterministic addresses across chains (same contract = same address)
- Network-specific gas analysis per deployment

**3. Team Notifications** → Know deployment status instantly

- Slack/Discord webhooks for deployment events
- Real-time status updates in team channels
- GitHub PR comments with gas analysis
- Non-blocking (notifications never stop deployments)

**4. Upgradeable Contract Support** → Safe proxy deployments

- UUPS proxy deployment with batch proposals
- Transparent proxy deployment with admin management
- UUPS proxy upgrades (upgradeToAndCall)
- Validation prevents storage layout mistakes

**5. Zero Private Keys** → Impossible to compromise

- NO keys in CI/CD environments
- Gnosis Safe multisig approval required
- Optional: Lit Protocol PKP for automated conditional signing
- Full audit trail: PR → CI → Safe → On-chain

### ✨ 3-Minute Integration

Add to your repository's workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy Smart Contracts with ZeroKeyCI

on:
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch: # Manual execution allowed

permissions:
  actions: write
  pull-requests: write
  contents: read

jobs:
  deploy:
    if: github.event_name == 'workflow_dispatch' || github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      actions: write
    steps:
      - uses: actions/checkout@v4

      # Security: Using @main for latest version
      # Recommended to pin to specific SHA in production: susumutomita/ZeroKeyCI@<commit-sha>
      - uses: susumutomita/ZeroKeyCI@main
        with:
          safe-address: ${{ vars.SAFE_ADDRESS }}
          network: base-sepolia
          contract-name: MyContract
          verify-blockscout: true
          rpc-url: ${{ secrets.BASE_SEPOLIA_RPC_URL }}
```

**That's it. No private keys in CI. Ever.**

### ⚡ Try Before You Commit (Demo Mode)

**Want to test ZeroKeyCI without setting up a Safe wallet?**

Use our demo Safe address to try the full workflow in 3 minutes:

```yaml
# Use the demo Safe for testing
with:
  safe-address: 0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663 # Demo Safe on Base Sepolia
  network: base-sepolia
  contract-name: MyContract
```

**What you get:**

- ✅ Full CI/CD workflow experience
- ✅ Real testnet deployment
- ✅ Understand Safe proposal flow
- ✅ No Safe wallet setup needed

**Security:**

- ⚠️ Demo mode is for **learning only** (Base Sepolia testnet)
- ⚠️ You still sign proposals manually (no auto-signing)
- ⚠️ For production, create your own Safe

**[→ Demo Mode Guide](docs/DEMO_MODE.md)** | **[→ Create Your Own Safe](docs/SAFE_SETUP.md)**

### 📚 Complete Documentation

- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - Add ZeroKeyCI to your project (3 minutes)
- **[How It Works](docs/HOW_IT_WORKS.md)** - Technical architecture and workflow
- **[Security Model](docs/SECURITY.md)** - Why this is secure
- **[Upgradeable Contracts](docs/UPGRADEABLE_CONTRACTS.md)** - UUPS & Transparent proxy support
- **[Production Deployment](docs/DEPLOYMENT.md)** - Deploy your own instance

---

## 🔑 How It Works (5-Minute Overview)

### The Key Innovation

**CI/CD does NOT deploy. It only creates proposals.**

```
❌ Traditional:  CI → Private Key → Sign → Broadcast → Deploy
✅ ZeroKeyCI:    CI → Create Proposal → Owners Sign → Execute
```

**Step-by-step workflow:**

1. **Developer merges PR** → Contract code in repository
2. **GitHub Actions runs** → Compiles, tests, validates with OPA policies
3. **Creates Safe proposal** → Generates `safe-proposal.json` with deployment transaction
4. **Posts as PR comment** → Safe owners review bytecode, constructor args, gas analysis
5. **Owners sign & execute in Safe UI** → Multisig approval required (e.g., 2-of-3 threshold)
6. **Contract deploys** → Full audit trail: PR → CI → Safe → On-chain

**Note:** Steps 1-4 are fully automated and tested. Optional: Configure Safe API key for automatic submission to Safe UI queue (currently manual approval workflow).

**Security guarantees:**

- 🔐 NO private keys anywhere in CI/CD
- ✅ Multisig approval required (one compromised account ≠ breach)
- 📝 Complete audit trail (PR → blockchain)
- 🔍 OPA policy validation before every signature
- 🛡️ Optional Lit Protocol PKP for automated conditional signing

---

## 🎯 One-Click GitHub Integration

**Set up ZeroKeyCI in your repository in 3 minutes with zero manual configuration!**

### Quick Setup

1. Visit [ZeroKeyCI Setup](https://zero-key-ci.vercel.app/setup)
2. Click **"Get Started Now"**
3. Authorize with GitHub
4. Select your repository
5. Review and merge the auto-generated PR
6. Configure GitHub Secrets (instructions in PR)
7. Start deploying! 🚀

### What You Get

ZeroKeyCI automatically creates a pull request containing:

- **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
  - Automated deployment pipeline
  - Safe multisig integration
  - OPA policy validation

- **Deployment Config** (`.zerokey/deploy.yaml`)
  - Network and contract settings
  - Gas configuration
  - Safe signer addresses

- **Security Policy** (`.zerokey/policy.rego`)
  - Validation rules (gas limits, networks, signers)
  - Automatic security checks on every deployment

### No Manual Work Required

**Before:** Copy workflow YAML, create config files, setup policies, configure secrets manually

**After:** Click button, merge PR, done!

**→ [Complete GitHub Integration Guide](docs/GITHUB_INTEGRATION.md)**

---

## 📊 Implementation Results

### Gas Cost Savings (Based on Gas Estimation Engine)

**Scenario 1: Multi-Network Deployment**

- Contract: ERC-721 NFT (24KB bytecode)
- Without ZeroKeyCI: Deploy to Ethereum mainnet → $180 gas fee (200 gwei)
- **With ZeroKeyCI**: Automatic recommendation "Deploy to Polygon" → **$2.50 gas fee** (saves $177.50)

**Scenario 2: Timing Optimization**

- Contract: UUPS Proxy + Implementation (combined 32KB)
- Without ZeroKeyCI: Deploy during peak hours → $95 gas fee (150 gwei)
- **With ZeroKeyCI**: Wait recommendation "Gas price will drop 40％ in 2 hours" → **$57 gas fee** (saves $38)

**Scenario 3: Network Comparison**

- Contract: ERC-20 Token (18KB bytecode)
- ZeroKeyCI compares ALL 10 networks automatically:
  - Ethereum: $120 | Polygon: $1.20 | Arbitrum: $0.80 | **Optimism: $0.60** ← Recommended
  - **Saves $119.40** with zero manual research

### Time Savings (Workflow Automation)

**Traditional Manual Deployment:**

- Research gas prices across networks: 15 mins
- Choose optimal network: 10 mins
- Compile and test: 5 mins
- Manual deployment: 5 mins
- **Total: 35 minutes per deployment**

**ZeroKeyCI Automated Workflow:**

- Merge PR: 30 seconds
- CI auto-compiles, tests, analyzes gas: 90 seconds
- Review proposal in Safe UI: 60 seconds
- Sign & execute: 30 seconds
- **Total: 3-4 minutes per deployment** (10x faster)

**Verified:** 605 automated tests ensure CI pipeline reliability

### Security Impact

**Before (Private Keys in GitHub Secrets):**

- Breach risk: Single compromised account = full treasury access
- Audit trail: Limited to GitHub audit logs
- Rollback: Impossible once transaction broadcast

**After (ZeroKeyCI Multisig):**

- Breach risk: Need 2+ of 3 accounts (significantly harder)
- Audit trail: Complete (PR → CI logs → Safe → On-chain)
- Rollback: Proposals can be rejected before execution

---

## 🛡️ Why This Is More Secure

**The fundamental security improvement**: Separation of build and execution.

### Attack Surface Comparison

**Traditional CI/CD** (Private keys in GitHub Secrets):

```
Attacker needs: 1 compromised GitHub account with repo access
Result: Full access to deployment private key → drain entire treasury
```

**ZeroKeyCI** (Multisig approval):

```
Attacker needs: 2+ of 3 Safe owners' hardware wallets
Result: Even with GitHub breach, attacker cannot deploy or access funds
```

### 🏆 ETHOnline 2025 - Sponsor Technology Integration

**Production-tested integrations with prize sponsor technologies:**

#### 🔥 Hardhat ($5,000 Prize Track)
Complete smart contract development infrastructure powering the entire pipeline.

**What we use:**
- Contract compilation and artifact generation ([hardhat.config.ts:1-147](hardhat.config.ts))
- **605+ unit tests passing** with Viem integration ([package.json:39](package.json))
- Network configuration for 10 EVM chains (Sepolia, Base, Arbitrum, Optimism, Polygon, etc.)
- Gas estimation via Hardhat local node simulation
- TypeScript support and plugin system

**Code locations:**
- Main config: `hardhat.config.ts`
- Compilation used in: `scripts/create-safe-proposal.ts:272-288`
- Workflow integration: `.github/workflows/deploy.yml:134-145`

**Why this qualifies:** Hardhat 3.0.7 is the foundation of our entire smart contract workflow. Every contract that goes through ZeroKeyCI is compiled, tested, and validated using Hardhat infrastructure.

---

#### ⚡ Lit Protocol ($5,000 Prize Track)
PKP (Programmable Key Pairs) for keyless automated signing in CI/CD - **Core Innovation**

**What we use:**
- PKP-based transaction signing without private keys in GitHub Actions
- Lit Actions for conditional signing (validates OPA policies, test results, PR approvals)
- Distributed threshold cryptography (private key never exists in full)
- datil-test network integration

**Code locations:**
- PKP signing script: `scripts/trigger-pkp-signing.ts:1-163`
- Workflow integration: `.github/workflows/deploy.yml:226-250`
- Complete setup guide: `docs/PKP_SETUP.md`

**Why this qualifies:** Lit Protocol PKPs are fundamental to ZeroKeyCI's security model. Without PKPs, automated keyless CI/CD deployments would be impossible. This is the core innovation that enables deploying smart contracts from GitHub Actions without storing any private keys.

---

#### 🛡️ Additional Security Technologies
- **Gnosis Safe SDK** → Multi-sig proposal creation and EIP-712 signing ([create-safe-proposal.ts](scripts/create-safe-proposal.ts))
- **Open Policy Agent** → Policy validation before every deployment ([policy validation](scripts/validate-deployment-policy.ts))

### 🤖 Two Ways to Deploy: Manual vs PKP Automation

ZeroKeyCI supports **two deployment workflows**. Choose based on your team's needs:

#### Option 1: Manual Signing (Default - Ready in 3 Minutes)

**How it works**:

```
PR Merged → CI Creates Proposal → Proposal in Safe UI → Team Signs Manually → Execute
```

**When to use**:

- ✅ Getting started with ZeroKeyCI
- ✅ Deploy infrequently (weekly or less)
- ✅ Want maximum human control
- ✅ Need no additional setup

**Setup**: Just add `SAFE_ADDRESS` and `RPC_URL` to GitHub Secrets. That's it!

---

#### Option 2: PKP Automation (Optional - Fully Automated)

**For high-frequency deployments**: Add Lit Protocol PKP for fully automated signing.

**What is PKP?**
PKP (Programmable Key Pair) is a distributed cryptographic key from Lit Protocol. The private key is split across Lit Protocol's decentralized network using threshold cryptography - no single party can access it.

**How it works**:

```
PR Merged → Tests Pass → OPA Validates → PKP Auto-Signs → Safe Executes
```

**When to use**:

- ✅ Deploy frequently (daily/weekly)
- ✅ Want zero manual steps
- ✅ Need 24/7 deployment capability
- ✅ Have automated CI/CD workflows

**Key benefits**:

- 🚀 3-minute end-to-end deployment (vs 30+ minutes manual)
- 🔐 Cryptographically enforced conditions (tests + policies must pass)
- 🛡️ Distributed key security (never exists in full anywhere)
- 👥 Human override maintained (multisig threshold ≥2)

**Required GitHub Secrets** (in addition to `SAFE_ADDRESS` and `RPC_URL`):
| Secret Name | What It Is | How to Get It |
|---|---|---|
| `PKP_PUBLIC_KEY` | Your PKP's Ethereum address | Obtained when minting PKP NFT (see setup guide) |
| `LIT_ACTION_IPFS_CID` | IPFS hash of conditional signing logic | Deployed once during PKP setup |
| `LIT_NETWORK` | Lit Protocol network (`datil-dev`, `datil-test`, `datil`) | Choose based on environment (dev/staging/prod) |

**Setup time**: 15-20 minutes (one-time)

**→ [Complete PKP Setup Guide](docs/PKP_SETUP.md)** - Step-by-step instructions

**Note**: You can start with Manual Signing and upgrade to PKP later. Both are equally secure.

---

## 📦 Using ZeroKeyCI in Your Project

ZeroKeyCI is designed as a **reusable GitHub Action** that you can integrate into any smart contract repository.

### Quick Integration Steps

1. **Add workflow to your repository**:

```yaml
# your-project/.github/workflows/deploy.yml
name: Deploy Smart Contracts with ZeroKeyCI

on:
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch: # Manual execution allowed

permissions:
  actions: write
  pull-requests: write
  contents: read

jobs:
  deploy:
    if: github.event_name == 'workflow_dispatch' || github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      actions: write
    steps:
      - uses: actions/checkout@v4

      # Security: Using @main for latest version
      # Recommended to pin to specific SHA in production: susumutomita/ZeroKeyCI@<commit-sha>
      - uses: susumutomita/ZeroKeyCI@main
        with:
          safe-address: ${{ vars.SAFE_ADDRESS }}
          network: base-sepolia
          contract-name: MyContract
          verify-blockscout: true
          rpc-url: ${{ secrets.BASE_SEPOLIA_RPC_URL }}
```

2. **Configure GitHub secrets**:

```bash
gh secret set BASE_SEPOLIA_RPC_URL --body "https://base-sepolia.g.alchemy.com/v2/YOUR_KEY"
gh variable set SAFE_ADDRESS --body "0xYourSafeAddress"
```

3. **Deploy**:
   - Merge a PR → ZeroKeyCI creates Safe proposal
   - Safe owners sign → Execute deployment
   - No private keys in CI!

**→ [Complete Integration Guide](docs/INTEGRATION_GUIDE.md)**

### Example Repositories

- **ERC20 Token**: [zerokeyci-erc20-example](https://github.com/susumutomita/zerokeyci-erc20-example)
- **UUPS Upgradeable**: [zerokeyci-uups-example](https://github.com/susumutomita/zerokeyci-uups-example)
- **Multi-Network**: [zerokeyci-multichain-example](https://github.com/susumutomita/zerokeyci-multichain-example)

---

## Team

- [Susumu Tomita](https://susumutomita.netlify.app/) - Full Stack Developer
