# ZeroKeyCI Integration Guide

Complete guide for integrating ZeroKeyCI into your existing smart contract project.

## Quick Start

ZeroKeyCI is a **reusable GitHub Action** that enables keyless smart contract deployment through Gnosis Safe multisig proposals. No private keys in CI/CD - ever.

### 3-Minute Setup

1. **Add to your workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy with ZeroKeyCI

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  deploy:
    if: github.event.pull_request.merged == true && contains(github.event.pull_request.labels.*.name, 'deploy')
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: sepolia
      contract-name: MyContract
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

2. **Configure GitHub secrets**:

```bash
gh secret set SEPOLIA_RPC_URL --body "https://sepolia.infura.io/v3/YOUR_KEY"
gh variable set SAFE_ADDRESS --body "0xYourSafeAddress"
```

3. **Deploy**:

- Merge a PR with the `deploy` label
- CI creates a Safe proposal (no private keys!)
- Safe owners sign and execute via Safe UI

Done! 🎉

## Integration Methods

### Method 1: Reusable Workflow (Recommended)

Best for: Complete integration with minimal setup.

```yaml
# .github/workflows/deploy.yml
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
      network: sepolia
      contract-name: MyToken
      run-tests: true
      verify-blockscout: true
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

### Method 2: Composite Action

Best for: Custom workflows with fine-grained control.

```yaml
# .github/workflows/custom-deploy.yml
name: Custom Deployment

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Compile contracts
        run: npx hardhat compile

      - name: Create Safe proposal
        uses: susumutomita/ZeroKeyCI@main
        with:
          safe-address: ${{ vars.SAFE_ADDRESS }}
          network: polygon
          contract-name: MyNFT
          rpc-url: ${{ secrets.POLYGON_RPC_URL }}

      - name: Custom post-processing
        run: |
          echo "Proposal created: ${{ steps.deploy.outputs.proposal-hash }}"
```

## Configuration

### Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| `safe-address` | Your Gnosis Safe address | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` |
| `network` | Target network | `sepolia`, `mainnet`, `polygon`, `arbitrum` |
| `contract-name` | Contract to deploy | `MyToken` |
| `rpc-url` | RPC endpoint | `https://sepolia.infura.io/v3/KEY` |

### Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `deploy-config-path` | Path to deployment config | `.zerokey/deploy.yaml` |
| `policy-path` | OPA policy file | `.zerokey/policy.rego` |
| `run-tests` | Run tests before proposal | `true` |
| `verify-blockscout` | Verify on Blockscout | `true` |
| `enable-envio` | Enable event indexing | `false` |

### Outputs

| Output | Description |
|--------|-------------|
| `proposal-hash` | Safe transaction proposal hash |
| `safe-address` | Safe address used |
| `chain-id` | Target chain ID |
| `proposal-json` | Path to proposal JSON file |
| `explorer-url` | Blockscout explorer URL |

## Setup Your Repository

### 1. Project Structure

```
your-project/
├── contracts/
│   └── MyContract.sol
├── .github/
│   └── workflows/
│       └── deploy.yml          # ZeroKeyCI workflow
├── .zerokey/                   # Optional configs
│   ├── deploy.yaml             # Deployment config
│   ├── policy.rego             # OPA policy
│   ├── explorer.json           # Blockscout config
│   └── envio-config.yaml       # Envio indexing
├── hardhat.config.js
└── package.json
```

### 2. Deployment Configuration

Create `.zerokey/deploy.yaml`:

```yaml
version: 1.0

# Network configuration
network: sepolia
chainId: 11155111

# Contract deployment
contract: MyContract
constructorArgs: []

# Deployment metadata
metadata:
  deployer: GitHub Actions
  environment: production
  framework: Hardhat

# Validation rules
validation:
  requireTests: true
  requireCoverage: 80
  allowedNetworks:
    - sepolia
    - mainnet
```

### 3. Security Policy (OPA)

Create `.zerokey/policy.rego`:

```rego
package deployment

# Allow deployment if all checks pass
allow {
  valid_network
  valid_contract
  tests_passed
}

# Network must be in allowlist
valid_network {
  input.network == "sepolia"
}

valid_network {
  input.network == "mainnet"
  input.environment == "production"
}

# Contract must have constructor args validated
valid_contract {
  count(input.constructorArgs) >= 0
}

# Tests must pass
tests_passed {
  input.testsStatus == "passed"
}

# Deny reasons
deny[msg] {
  not valid_network
  msg := "Network not allowed"
}

deny[msg] {
  not tests_passed
  msg := "Tests must pass"
}
```

### 4. GitHub Secrets

Configure secrets in your repository:

```bash
# Required
gh secret set SEPOLIA_RPC_URL --body "https://sepolia.infura.io/v3/YOUR_KEY"
gh secret set MAINNET_RPC_URL --body "https://mainnet.infura.io/v3/YOUR_KEY"

# Optional (for Blockscout verification)
gh secret set BLOCKSCOUT_API_KEY --body "YOUR_API_KEY"

# Public variables
gh variable set SAFE_ADDRESS --body "0xYourSafeAddress"
```

## Usage Examples

### Example 1: Simple ERC20 Deployment

```yaml
name: Deploy ERC20 Token

on:
  push:
    tags: ['v*']

jobs:
  deploy:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: mainnet
      contract-name: MyToken
      verify-blockscout: true
    secrets:
      rpc-url: ${{ secrets.MAINNET_RPC_URL }}
      blockscout-api-url: https://eth.blockscout.com/api
```

### Example 2: UUPS Upgradeable Contract

```yaml
name: Deploy Upgradeable Contract

on:
  workflow_dispatch:
    inputs:
      deployment_type:
        type: choice
        options:
          - deployment
          - upgrade

jobs:
  deploy:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: polygon
      contract-name: MyUUPSContract
      run-tests: true
      verify-blockscout: true
      enable-envio: true  # Track upgrade events
    secrets:
      rpc-url: ${{ secrets.POLYGON_RPC_URL }}
```

### Example 3: Multi-Network Deployment

#### Sequential Deployment (Recommended for Production)

Deploy to testnet first, then mainnet after validation:

```yaml
name: Deploy to Multiple Networks

on:
  release:
    types: [published]

jobs:
  deploy-sepolia:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SEPOLIA_SAFE_ADDRESS }}
      network: sepolia
      contract-name: MyContract
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}

  deploy-mainnet:
    needs: deploy-sepolia
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.MAINNET_SAFE_ADDRESS }}
      network: mainnet
      contract-name: MyContract
    secrets:
      rpc-url: ${{ secrets.MAINNET_RPC_URL }}
```

#### Parallel Multi-Chain Deployment

Deploy to multiple networks simultaneously using the multi-chain script:

**Create configuration** (`.zerokey/deploy-multi.yaml`):

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

**Workflow**:

```yaml
name: Multi-Chain Deployment

on:
  workflow_dispatch:

jobs:
  deploy-multi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkout ZeroKeyCI
        uses: actions/checkout@v4
        with:
          repository: susumutomita/ZeroKeyCI
          path: .zerokeyci
          ref: main

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: |
          cd .zerokeyci
          bun install --frozen-lockfile

      - name: Compile contracts
        run: npx hardhat compile

      - name: Create multi-chain proposals
        run: |
          cd .zerokeyci
          bun run scripts/create-multi-safe-proposals.ts ../.zerokey/deploy-multi.yaml

      - name: Upload proposals
        uses: actions/upload-artifact@v4
        with:
          name: multi-chain-proposals
          path: |
            safe-proposal-*.json
            multi-deployment-summary.json
```

**Output**: Generates separate Safe proposals for each network:
- `safe-proposal-sepolia.json`
- `safe-proposal-polygon.json`
- `safe-proposal-base.json`
- `multi-deployment-summary.json` (overview)

**Benefits**:
- Single command deploys to multiple networks
- Deterministic addresses (same bytecode = same address on all chains)
- Cost comparison across networks
- Individual proposals per network for Safe signing

### Example 4: With Envio Event Indexing

```yaml
name: Deploy with Event Indexing

on:
  pull_request:
    types: [closed]

jobs:
  deploy:
    if: github.event.pull_request.merged == true
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: sepolia
      contract-name: MyDeFiProtocol
      enable-envio: true
      envio-config-path: .zerokey/envio-config.yaml
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}

  # Setup Envio indexer after deployment
  setup-indexing:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Envio HyperIndex
        run: |
          npx envio-cli deploy \
            --config .zerokey/envio-config.yaml \
            --contract-address ${{ needs.deploy.outputs.proposal-hash }}
```

## Advanced Configuration

### Blockscout Verification

Create `.zerokey/explorer.json`:

```json
{
  "chain": {
    "chainId": 11155111,
    "network": "sepolia",
    "explorerUrl": "https://eth-sepolia.blockscout.com"
  },
  "verification": {
    "autoVerify": true,
    "compilerVersion": "0.8.20",
    "optimizationEnabled": true,
    "optimizationRuns": 200
  },
  "mcp": {
    "enabled": true,
    "features": ["contract_metadata", "transaction_tracking"]
  }
}
```

### Envio Event Indexing

Create `.zerokey/envio-config.yaml`:

```yaml
name: my-contract-indexer
description: Index my contract events

networks:
  - id: 11155111
    name: sepolia
    start_block: 5000000
    rpc_config:
      url: ${SEPOLIA_RPC_URL}

contracts:
  - name: MyContract
    abi_file_path: ./artifacts/contracts/MyContract.sol/MyContract.json
    handler: src/EventHandlers.ts
    events:
      - event: "Transfer(address,address,uint256)"
      - event: "Approval(address,address,uint256)"
```

## Workflow Triggers

### PR Merge with Label

```yaml
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  deploy:
    if: github.event.pull_request.merged == true && contains(github.event.pull_request.labels.*.name, 'deploy')
```

### Manual Trigger

```yaml
on:
  workflow_dispatch:
    inputs:
      network:
        description: 'Network to deploy to'
        required: true
        type: choice
        options:
          - sepolia
          - mainnet
```

### Tag-based Release

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

## Security Best Practices

### 1. Never Store Private Keys

```yaml
# ❌ NEVER DO THIS
env:
  PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}

# ✅ DO THIS
with:
  safe-address: ${{ vars.SAFE_ADDRESS }}
  rpc-url: ${{ secrets.RPC_URL }}  # Public RPC, no private key needed
```

### 2. Use Safe Multisig

- Require 2+ signatures for deployments
- Separate proposal creation from execution
- Audit trail via Safe Transaction Service

### 3. Validate with OPA

- Enforce network restrictions
- Require test coverage
- Validate constructor arguments

### 4. Review Proposals

Safe owners must review before signing:
- Contract bytecode matches source
- Constructor arguments are correct
- Gas settings are reasonable

## Troubleshooting

### Common Issues

#### 1. "Invalid Safe address"

```
Error: Invalid Safe address format
```

**Solution**: Ensure Safe address is a valid Ethereum address:
```bash
gh variable set SAFE_ADDRESS --body "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

#### 2. "Contract compilation failed"

```
Error: Cannot find artifact for contract
```

**Solution**: Ensure Hardhat compiles successfully:
```bash
npx hardhat compile
```

#### 3. "OPA policy validation failed"

```
Error: OPA policy validation failed: Network not allowed
```

**Solution**: Update `.zerokey/policy.rego` to allow the network:
```rego
valid_network {
  input.network == "your-network"
}
```

#### 4. "RPC connection timeout"

```
Error: Failed to connect to RPC endpoint
```

**Solution**: Verify RPC URL is correct and accessible:
```bash
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Migration Guide

### From Traditional CI/CD with Private Keys

**Before** (with private keys):
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy contract
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}  # 🔴 Risk!
        run: |
          npx hardhat run scripts/deploy.js --network sepolia
```

**After** (keyless with ZeroKeyCI):
```yaml
jobs:
  deploy:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}  # ✅ No keys!
      network: sepolia
      contract-name: MyContract
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

### From OpenZeppelin Defender

ZeroKeyCI offers similar security with no vendor lock-in:

| Feature | Defender | ZeroKeyCI |
|---------|----------|-----------|
| Keyless deployment | ✅ | ✅ |
| Multisig support | ✅ | ✅ |
| Policy validation | ✅ | ✅ (OPA) |
| Cost | 💰 Paid | 🆓 Free |
| Open source | ❌ | ✅ |
| Self-hosted | ❌ | ✅ |

## Support

- **Documentation**: [docs/](/)
- **Issues**: [GitHub Issues](https://github.com/susumutomita/ZeroKeyCI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/susumutomita/ZeroKeyCI/discussions)

## Next Steps

1. ✅ [Set up your first deployment](/docs/DEPLOYMENT.md)
2. 📚 [Learn how it works](/docs/HOW_IT_WORKS.md)
3. 🔐 [Review security architecture](/docs/SECURITY.md)
4. 🛡️ [Configure Safe multisig](/docs/SAFE_SETUP.md)

---

**Questions?** Check our [FAQ](/docs/HOW_IT_WORKS.md#faq) or open a [discussion](https://github.com/susumutomita/ZeroKeyCI/discussions).
