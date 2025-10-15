![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/susumutomita/ZeroKeyCI)
![GitHub top language](https://img.shields.io/github/languages/top/susumutomita/ZeroKeyCI)
![GitHub pull requests](https://img.shields.io/github/issues-pr/susumutomita/ZeroKeyCI)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/susumutomita/ZeroKeyCI)
![GitHub repo size](https://img.shields.io/github/repo-size/susumutomita/ZeroKeyCI)
[![ci](https://github.com/susumutomita/ZeroKeyCI/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/susumutomita/ZeroKeyCI/actions/workflows/ci.yml)

# 🛠 ZeroKey CI
**Key-less CI/CD for smart contracts — secure, auditable, and open.**

> ETHOnline 2025 submission
> [Demo → https://hackathon.project.io](https://hackathon.project.io)

---

## 🚀 Overview
ZeroKey CI is a **reusable GitHub Action** for keyless smart contract deployment.
It removes the biggest security risk in Web3 DevOps: storing private keys in CI/CD pipelines.

### ✨ 3-Minute Integration

Add to your repository's workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy with ZeroKeyCI

on:
  pull_request:
    types: [closed]

jobs:
  deploy:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: sepolia
      contract-name: MyContract
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

Done! No private keys in CI. Ever.

**→ [Integration Guide (Complete Setup)](docs/INTEGRATION_GUIDE.md)**

### 🔑 The Key Innovation

**CI/CD does NOT deploy. It only creates proposals.**

Instead of signing transactions inside GitHub Actions, the pipeline only **creates Safe transaction proposals** (unsigned). Execution happens later — through **Gnosis Safe multisig owners**, **delegated signing via Lit Protocol Vincent**, or a **local KMS container** — ensuring that no private key ever lives in CI.

```
Traditional:  CI → Private Key → Sign → Broadcast → Deploy ❌
ZeroKeyCI:    CI → Create Proposal → Owners Sign → Execute ✅
```

ZeroKey CI makes smart-contract deployment:
- 🔐 **Secure** – NO private keys in CI, multisig approval required
- 🧩 **Auditable** – every PR is linked to its on-chain transaction
- ⚙️ **Developer-friendly** – runs free on any laptop or public CI
- 🌐 **Composable** – integrates with Hardhat 3, Blockscout, Envio, Lit Protocol
- 🧾 **Spec-first** – editor integration generates/validates deploy & policy specs
- 📦 **Reusable** – import as GitHub Action into any repository

**→ [How It Works (Detailed Explanation)](docs/HOW_IT_WORKS.md)**
**→ [Security Architecture](docs/SECURITY.md)**
**→ [Production Deployment Guide](docs/DEPLOYMENT.md)**
**→ [Integration Guide (Use in Your Project)](docs/INTEGRATION_GUIDE.md)**

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Developer                            │
│                     Creates Pull Request                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
│                                                              │
│  1. Compile contracts (Hardhat 3)                           │
│  2. Run tests (100% coverage)                               │
│  3. Validate against OPA policies                           │
│  4. Create Safe transaction proposal (UNSIGNED)             │
│  5. Upload proposal as artifact                             │
│                                                              │
│  ❌ NO PRIVATE KEYS                                         │
│  ❌ NO SIGNING                                              │
│  ❌ NO TRANSACTION EXECUTION                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
              [Safe Proposal Artifact]
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Gnosis Safe Multisig                      │
│                                                              │
│  👤 Owner 1 → Reviews & Signs (Hardware Wallet)            │
│  👤 Owner 2 → Reviews & Signs (Hardware Wallet)            │
│  👤 Owner 3 → Reviews & Signs (MetaMask/Mobile)            │
│                                                              │
│  When threshold reached (e.g., 2-of-3):                     │
│    → Transaction validates                                   │
│    → Contract deploys                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Deployed Contract                         │
│                                                              │
│  📊 Blockscout Explorer: View transaction                   │
│  📈 Envio Dashboard: Real-time monitoring                   │
│  ✅ Full audit trail: PR → CI → Safe → On-chain            │
└─────────────────────────────────────────────────────────────┘
```

### Core Components
- **Hardhat 3** – build, simulation and testing suite
- **Gnosis Safe SDK** – creates deployment or upgrade proposals
- **SoftKMS / Vault / Cloud KMS** – isolated signer (non-exportable key)
- **Lit Protocol Vincent** – scoped delegated signing (“upgradeTo only”)
- **Open Policy Agent (OPA)** – verifies payloads before signing
- **Blockscout Autoscout + SDK + MCP** – instant explorer visibility
- **Envio HyperIndex / HyperSync** – real-time monitoring of Safe events

---

## ⚙️ How It Works
1. A developer opens a PR → **Hardhat tests** run automatically.
2. On merge, CI compiles contracts and builds a **Safe transaction proposal**.
3. The **policy gateway** checks the payload and signs via local/remote KMS if approved.
4. Safe owners or **Lit delegates** finalize execution.
5. **Blockscout** and **Envio** update dashboards in real time.

In the hackathon build we used a lightweight **SoftKMS** signer that can be swapped for any free or cloud-hosted key service (AWS, GCP, HashiCorp Vault).
Keys are non-exportable and use short-lived tokens, so ZeroKey CI can run **without any paid cloud dependency**.

## 📝 Specs & Editor Integration

ZeroKey CI supports a *spec-first* workflow. If you use the companion editor extension (VS Code / Cursor), you can generate, edit, and validate the following spec files. The CI will automatically detect them if present.

**Default paths**
- `.zerokey/deploy.yaml` — deployment/upgrade intent used to build the Safe proposal
- `.zerokey/policy.rego` — OPA policy applied by the signing gateway
- `.zerokey/explorer.json` — Blockscout Autoscout mapping & metadata
- `.zerokey/indexer.yaml` — Envio HyperIndex schema and event filters

**Editor workflow**
1. Run **“ZeroKey: Generate Specs”** in your editor to scaffold the files above.
2. Adjust network, addresses, and constraints.
3. Commit & open a PR — CI will validate the specs and create a Safe proposal from them.

**Example: `.zerokey/deploy.yaml`**
```yaml
network: sepolia
chainId: 11155111
targets:
  - name: ExampleUUPS
    proxy: "0xProxyAddress"
    action: upgrade
    newImplementation: "0xNewImplAddress"
constraints:
  value: 0
  selectorsAllowlist:
    - "upgradeTo(address)"
meta:
  pr: "${GITHUB_REF_NAME}"
  commit: "${GITHUB_SHA}"

package zerokey.deploy

default allow = false

allow {
  input.chainId == 11155111
  input.value == 0
  input.to == "0xProxyAddress"
  input.function == "upgradeTo(address)"
}
```

---

## 🧩 Integrations & Partner Tech
- **Hardhat 3** → satisfies the Hardhat Prize track
- **Blockscout Autoscout / SDK / MCP** → connects PRs to transactions
- **Lit Protocol Vincent** → implements scoped delegated signing
- **Envio HyperIndex / HyperSync** → indexes Safe proposals and approvals
- **Pyth Price Feeds** → optional safeguard to pause deploys on high gas
- **Open Policy Agent** → declarative policy enforcement
- **SoftKMS / Vault** → free signing backend for reproducibility

---

## 🧪 Hacky Details
- PR diff hash automatically generates the `upgradeTo()` payload — no manual input.
- PR metadata is embedded in Safe transaction meta fields for full traceability.
- Gas-spike auto-pause powered by **Pyth** oracle feed.

---

## 🏆 Hackathon Relevance
ZeroKey CI aligns with multiple ETHOnline 2025 prizes:
- **Hardhat 3** – project built and tested entirely in Hardhat 3.
- **Blockscout** – uses Autoscout + SDK + MCP for explorer integration.
- **Lit Protocol Vincent** – delegated signing scopes for CI automation.
- **Envio** – HyperIndex/HyperSync for real-time CI telemetry.

Each integration is open-source and reproducible without paid cloud services.

---

---

## 📦 Using ZeroKeyCI in Your Project

ZeroKeyCI is designed as a **reusable GitHub Action** that you can integrate into any smart contract repository.

### Quick Integration Steps

1. **Add workflow to your repository**:

```yaml
# your-project/.github/workflows/deploy.yml
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
      contract-name: MyContract
      verify-blockscout: true
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

2. **Configure GitHub secrets**:

```bash
gh secret set SEPOLIA_RPC_URL --body "https://sepolia.infura.io/v3/YOUR_KEY"
gh variable set SAFE_ADDRESS --body "0xYourSafeAddress"
```

3. **Deploy**:
   - Merge a PR → ZeroKeyCI creates Safe proposal
   - Safe owners sign → Execute deployment
   - No private keys in CI!

### Integration Options

- **Method 1**: Reusable workflow (recommended)
- **Method 2**: Composite action (custom control)
- **Method 3**: Fork and customize

**→ [Complete Integration Guide](docs/INTEGRATION_GUIDE.md)**

### Example Repositories

- **ERC20 Token**: [zerokeyci-erc20-example](https://github.com/susumutomita/zerokeyci-erc20-example)
- **UUPS Upgradeable**: [zerokeyci-uups-example](https://github.com/susumutomita/zerokeyci-uups-example)
- **Multi-Network**: [zerokeyci-multichain-example](https://github.com/susumutomita/zerokeyci-multichain-example)

---

## 📚 Next Steps
- Add full **Vincent UI** for per-function delegation
- Extend **OPA policies** for multi-network governance
- Publish to **GitHub Marketplace** as official action
- Optional **ZK-proof plugin** for deploy-policy attestations

---

### 💡 Team
Built by **Susumu Tomita (たみぃ)** and collaborators
for **ETHOnline 2025**

