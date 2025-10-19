# ZeroKeyCI Deployment Guide

Complete guide for deploying smart contracts using ZeroKeyCI with Gnosis Safe multisig approval.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Deployment Workflow](#deployment-workflow)
- [GitHub Actions Integration](#github-actions-integration)
- [Gas Optimization Reports](#gas-optimization-reports)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Overview

ZeroKeyCI enables secure, keyless smart contract deployments through Gnosis Safe multisig wallets. The workflow:

1. **Developer** creates PR with contract changes
2. **CI** generates unsigned Safe transaction proposal
3. **Safe owners** review and approve via Safe UI
4. **Contract** deploys after threshold signatures

**Key Benefits:**
- 🔐 No private keys in CI/CD
- ⛽ Automatic gas optimization analysis
- 🌐 Multi-network cost comparison
- ✅ Policy-based validation (OPA)
- 📊 Comprehensive deployment reports

## Prerequisites

### 1. Gnosis Safe Wallet

Create a Gnosis Safe at [safe.global](https://safe.global):

```bash
# Supported networks:
## Mainnets:
- Ethereum Mainnet (chainId: 1)
- Polygon (chainId: 137)
- Arbitrum (chainId: 42161)
- Optimism (chainId: 10)
- Base (chainId: 8453)

## Testnets:
- Sepolia (chainId: 11155111)
- Polygon Amoy (chainId: 80002)
- Arbitrum Sepolia (chainId: 421614)
- Optimism Sepolia (chainId: 11155420)
- Base Sepolia (chainId: 84532)
```

**Required Safe configuration:**
- Minimum 2 owners (recommended 3+)
- Threshold ≥ 2 (for production)
- Sufficient ETH for deployment gas

### 2. Repository Setup

Install ZeroKeyCI in your repository:

```bash
# Clone or initialize your project
git clone <your-repo>
cd <your-repo>

# Install dependencies
bun install

# Compile contracts
npx hardhat compile
```

### 3. GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

```bash
SAFE_ADDRESS         # Your Gnosis Safe address (checksummed)
GITHUB_TOKEN         # Auto-provided by GitHub Actions
GAS_COST_THRESHOLD   # Optional: Max acceptable cost in USD (default: $100 mainnet, $10 testnet)
```

**Important**: Use checksummed Safe address format:
```bash
# ✅ Correct (mixed case)
0xCc87e0A15A934c971fD1E28AaC303c011fe3b591

# ❌ Wrong (all lowercase)
0xcc87e0a15a934c971fd1e28aac303c011fe3b591
```

Get checksummed address:
```bash
node -e "const {utils} = require('ethers'); console.log(utils.getAddress('YOUR_ADDRESS'))"
```

## Configuration

### Deployment Configuration File

Create `.zerokey/deploy.yaml`:

```yaml
# Network to deploy on
network: sepolia

# Contract name (must match Solidity file)
contract: ExampleUUPS

# Constructor arguments (if any)
constructorArgs:
  - "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"  # initialOwner
  - 1000                                          # initialValue

# ETH value to send (in wei, as string)
value: "0"

# Optional: Gas settings (usually auto-estimated)
gasLimit: 5000000
gasPrice: "20000000000"  # 20 gwei

# Optional: Upgradeable proxy configuration
proxy:
  type: uups  # or "transparent"
  initializeArgs:
    - "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Configuration Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `network` | string | ✅ | Target network (sepolia, mainnet, polygon, arbitrum, optimism, base) |
| `contract` | string | ✅ | Contract name (must exist in `contracts/`) |
| `constructorArgs` | array | ❌ | Constructor parameters (empty for upgradeable) |
| `value` | string | ❌ | ETH to send (default: "0") |
| `gasLimit` | number | ❌ | Max gas (auto-estimated if omitted) |
| `gasPrice` | string | ❌ | Gas price in wei (auto-fetched if omitted) |
| `proxy` | object | ❌ | Upgradeable proxy config (see [Advanced Features](#advanced-features)) |

### Example Configurations

#### Simple Contract Deployment

```yaml
network: sepolia
contract: SimpleStorage
constructorArgs:
  - 42  # initialValue
value: "0"
```

#### Upgradeable UUPS Proxy

```yaml
network: mainnet
contract: MyUpgradeableContract
proxy:
  type: uups
  initializeArgs:
    - "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"  # owner
constructorArgs: []  # Empty for upgradeable
value: "0"
```

## Deployment Workflow

### Step 1: Create Deployment Branch

```bash
git checkout -b deploy/my-contract
```

### Step 2: Configure Deployment

Edit `.zerokey/deploy.yaml`:

```yaml
network: sepolia
contract: MyContract
constructorArgs:
  - "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
value: "0"
```

### Step 3: Commit and Push

```bash
git add .zerokey/deploy.yaml contracts/MyContract.sol
git commit -m "feat: deploy MyContract to Sepolia"
git push origin deploy/my-contract
```

### Step 4: Create Pull Request

Create PR on GitHub. CI will automatically:
1. Compile contracts
2. Generate Safe transaction proposal
3. Run gas optimization analysis
4. Post gas report as PR comment

**Example CI Output:**

```
✅ Safe proposal created successfully
Proposal Hash: 0x025ab97e311e757109e6ce5f46d5540404e99e0475cb650a447013b0d270412c
Expected Address: 0x9f265d7fE75d309B971cdc8Cd0C3EA150d8e6dD8
Network: sepolia
Estimated Gas: 250,000
Estimated Cost: $12.50 (0.005 ETH)
```

### Step 5: Review Gas Report

CI posts a comprehensive gas analysis comment:

```markdown
## ⛽ Gas Optimization Report

### Gas Estimate
- **Bytecode Size:** 8,472 bytes (35% of 24KB limit)
- **Estimated Gas:** 250,000
- **Estimated Cost:** $12.50 (0.005 ETH)
- **Gas Price:** 20 gwei

### Network Comparison
| Network | Cost | Savings |
|---------|------|---------|
| Sepolia | $12.50 | - |
| Polygon | $0.05 | **$12.45** |
| Arbitrum | $2.50 | $10.00 |
| Optimism | $3.00 | $9.50 |

**Recommended:** Deploy on Polygon for 99% cost savings

### Recommendations
🟡 **Moderate Deployment Cost**
- Deployment will cost approximately $12.50 on sepolia
- Consider deploying during off-peak hours
- Review network comparison for alternatives
```

### Step 6: Download Proposal

Download `safe-proposal.json` from CI artifacts:

```bash
# Using GitHub CLI
gh run download <RUN_ID>

# Or download from GitHub UI:
# Actions → <Your Workflow Run> → Artifacts → safe-proposal
```

### Step 7: Submit to Safe

Two options for submitting the proposal:

#### Option A: Safe Transaction Builder (Recommended)

1. Go to [safe.global](https://safe.global)
2. Connect to your Safe
3. Navigate to **Transaction Builder**
4. Upload `safe-proposal.json`
5. Review transaction details
6. Click **Create Transaction**

#### Option B: Manual Submission

```typescript
import { ethers } from 'ethers';
import proposal from './safe-proposal.json';

const safe = await ethers.getContractAt('GnosisSafe', SAFE_ADDRESS);
await safe.proposeTransaction(
  proposal.proposal.to,
  proposal.proposal.value,
  proposal.proposal.data,
  proposal.proposal.operation
);
```

### Step 8: Approve and Execute

1. **Safe owners** review transaction in Safe UI
2. **Threshold signatures** required (e.g., 2 of 3)
3. **Last signer** executes transaction
4. **Contract** deploys to `deployment.expectedAddress`

### Step 9: Verify Deployment

```bash
# Check deployment address
cast code <EXPECTED_ADDRESS> --rpc-url <RPC_URL>

# Should return bytecode (not 0x)
```

## GitHub Actions Integration

ZeroKeyCI integrates seamlessly with GitHub Actions.

### Workflow File

`.github/workflows/deploy.yml`:

```yaml
name: Deploy Contract

on:
  pull_request:
    paths:
      - 'contracts/**'
      - '.zerokey/deploy.yaml'

jobs:
  generate-proposal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Compile contracts
        run: npx hardhat compile

      - name: Generate Safe proposal
        env:
          SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GAS_COST_THRESHOLD: ${{ vars.GAS_COST_THRESHOLD || '100' }}
        run: bun run scripts/create-safe-proposal.ts

      - name: Upload proposal artifact
        uses: actions/upload-artifact@v3
        with:
          name: safe-proposal
          path: safe-proposal.json
```

### Workflow Outputs

GitHub Actions sets outputs:

```yaml
outputs:
  proposal_hash: ${{ steps.generate.outputs.proposal_hash }}
  deployment_address: ${{ steps.generate.outputs.deployment_address }}
  estimated_cost: ${{ steps.generate.outputs.estimated_cost }}
```

Access in subsequent steps:

```yaml
- name: Comment PR
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        body: `Deployment Address: ${{ steps.generate.outputs.deployment_address }}`
      })
```

## Gas Optimization Reports

ZeroKeyCI provides comprehensive gas analysis:

### Report Components

1. **Gas Estimate**
   - Bytecode size (with 24KB limit percentage)
   - Estimated deployment gas
   - Estimated cost (USD and ETH)
   - Current gas price

2. **Network Comparison**
   - Cost comparison across all supported networks
   - Potential savings by deploying on cheaper networks
   - Recommended network for cost optimization

3. **Optimization Recommendations**
   Six types of recommendations:
   - 🔴 High deployment cost (>$50)
   - 🟡 Moderate deployment cost ($20-$50)
   - 🟢 Low deployment cost (<$20)
   - ⚠️ Large bytecode size (>20KB, approaching 24KB limit)
   - 💡 Cheaper network available (>$5 savings)
   - ⏰ High gas price (>100 gwei)

### Report Formats

**CLI Format** (terminal output):
```
=== Gas Optimization Report ===
Bytecode: 8,472 bytes (35% of limit)
Gas: 250,000
Cost: $12.50 (0.005 ETH @ 20 gwei)

Recommendations:
🟡 Moderate deployment cost
   → Deploy during off-peak hours
```

**CI Format** (GitHub PR comment):
```markdown
## ⛽ Gas Optimization Report
[Detailed markdown table with recommendations]
```

**JSON Format** (programmatic access):
```json
{
  "estimate": {
    "deploymentGas": 250000,
    "costInUSD": "12.50",
    "costInEther": "0.005"
  },
  "recommendations": [...]
}
```

## Advanced Features

### Multi-Chain Deployment

Deploy the same contract to multiple networks with a single configuration file.

#### Configuration

Create `.zerokey/deploy-multi.yaml`:

```yaml
deployments:
  - network: sepolia
    safeAddress: "0xCc87e0A15A934c971fD1E28AaC303c011fe3b591"
    contract: MyContract
    constructorArgs: []
    value: "0"

  - network: polygon
    safeAddress: "0xCc87e0A15A934c971fD1E28AaC303c011fe3b591"
    contract: MyContract
    constructorArgs: []
    value: "0"

  - network: base
    safeAddress: "0xCc87e0A15A934c971fD1E28AaC303c011fe3b591"
    contract: MyContract
    constructorArgs: []
    value: "0"
```

#### Running Multi-Chain Deployment

```bash
# Generate proposals for all networks
bun run scripts/create-multi-safe-proposals.ts .zerokey/deploy-multi.yaml

# Outputs:
# - safe-proposal-sepolia.json
# - safe-proposal-polygon.json
# - safe-proposal-base.json
# - multi-deployment-summary.json
```

#### Summary Output

The script generates a summary file with deployment overview:

```json
{
  "totalDeployments": 3,
  "networks": ["sepolia", "polygon", "base"],
  "deployments": [
    {
      "network": "sepolia",
      "proposalFile": "safe-proposal-sepolia.json",
      "expectedAddress": "0x9f265d7fE75d309B971cdc8Cd0C3EA150d8e6dD8",
      "estimatedCost": "$12.50",
      "chainId": 11155111
    }
  ],
  "timestamp": "2025-10-19T11:58:55.977Z"
}
```

**Key Features:**
- Single command deploys to multiple networks
- Individual proposal files per network
- Cost comparison across all networks
- Deterministic deployment addresses (same contract = same address on all chains)

**Note:** In production, you'll need separate Safe wallets on each network. The script validates all Safe addresses before generating proposals.

### Upgradeable Contracts

ZeroKeyCI supports OpenZeppelin upgradeable patterns.

#### UUPS Proxy Deployment

```yaml
network: mainnet
contract: MyUpgradeableContract

proxy:
  type: uups
  initializeArgs:
    - "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"  # initialOwner

constructorArgs: []  # Always empty for upgradeable
value: "0"
```

**What this deploys:**
1. Implementation contract (MyUpgradeableContract)
2. ERC1967Proxy pointing to implementation
3. Calls `initialize(initialOwner)` on proxy

#### UUPS Proxy Upgrade

```yaml
network: mainnet
contract: MyUpgradeableContractV2

proxy:
  type: uups
  proxyAddress: "0x1234..."  # Existing proxy address
  # Optional: call data after upgrade
  initializeArgs:
    - "arg1"
    - "arg2"

constructorArgs: []
value: "0"
```

**What this does:**
1. Deploys new implementation (MyUpgradeableContractV2)
2. Calls `upgradeToAndCall(newImpl, data)` on existing proxy

#### Transparent Proxy Deployment

```yaml
network: mainnet
contract: MyContract

proxy:
  type: transparent
  admin: "0xADMIN_ADDRESS"  # Optional: ProxyAdmin address
  initializeArgs:
    - "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

constructorArgs: []
value: "0"
```

**What this deploys:**
1. Implementation contract
2. ProxyAdmin contract (if `admin` not specified)
3. TransparentUpgradeableProxy
4. Calls `initialize(...)` on proxy

### Policy Validation

ZeroKeyCI uses Open Policy Agent (OPA) for deployment validation.

**Policy File:** `policies/deployment.rego`

```rego
package deployment

# Deny deployments with excessive gas
deny[msg] {
  input.gasLimit > 10000000
  msg := "Gas limit exceeds 10M"
}

# Require Safe multisig for mainnet
deny[msg] {
  input.network == "mainnet"
  not input.safe
  msg := "Mainnet deployments require Safe multisig"
}

# Warn about high-value deployments
warn[msg] {
  input.value > 1000000000000000000  # 1 ETH
  msg := "Deploying with >1 ETH value"
}
```

### Custom Gas Thresholds

Set per-network cost thresholds:

```yaml
# In .zerokey/deploy.yaml
network: mainnet

gasThresholds:
  error: 100    # Fail if >$100
  warning: 50   # Warn if >$50
```

Or use environment variable:

```bash
GAS_COST_THRESHOLD=75 bun run scripts/create-safe-proposal.ts
```

## Troubleshooting

### Common Issues

#### 1. "Invalid safe address" Error

**Cause:** Address not checksummed

**Solution:**
```bash
# Get checksummed address
node -e "const {utils} = require('ethers'); console.log(utils.getAddress('0xYOUR_ADDRESS'))"

# Use the output in SAFE_ADDRESS secret
```

#### 2. "Contract artifact not found"

**Cause:** Contract not compiled

**Solution:**
```bash
npx hardhat compile
# Verify artifact exists:
ls artifacts/contracts/YourContract.sol/YourContract.json
```

#### 3. "Gas price fetching failed"

**Cause:** Network API unavailable (non-blocking)

**Impact:** Gas analysis skipped, deployment continues

**Solution:** No action needed (gas analysis is optional)

#### 4. "Bytecode too large" (>24KB)

**Cause:** Contract exceeds Spurious Dragon limit

**Solutions:**
- Enable optimizer: `hardhat.config.ts` → `optimizer: { enabled: true, runs: 200 }`
- Split contract into libraries
- Remove unused code
- Use upgradeable proxy pattern

#### 5. Safe transaction reverts

**Possible causes:**
- Incorrect constructor arguments
- Contract already deployed at address
- Insufficient gas
- Contract constructor reverts

**Debugging:**
```bash
# Simulate locally with Hardhat
npx hardhat run scripts/simulate-deployment.ts

# Check logs in Safe UI transaction details
```

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug bun run scripts/create-safe-proposal.ts
```

Output includes:
- Bytecode analysis details
- Gas estimation breakdown
- API request/response logs
- Safe proposal generation steps

### Getting Help

- **Documentation:** [docs/](../docs/)
- **Examples:** [.zerokey/examples/](../.zerokey/examples/)
- **Issues:** [GitHub Issues](https://github.com/your-org/zerokey-ci/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/zerokey-ci/discussions)

## Next Steps

- ✅ Configure `.zerokey/deploy.yaml`
- ✅ Set `SAFE_ADDRESS` secret
- ✅ Create deployment PR
- ✅ Review gas optimization report
- ✅ Download and submit Safe proposal
- ✅ Approve with threshold signatures
- ✅ Execute deployment

**Happy deploying! 🚀**
