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
ZeroKey CI is a **key-less continuous deployment framework** for EVM-based smart contracts.
It removes the biggest security risk in Web3 DevOps: storing private keys in CI/CD pipelines.

Instead of signing transactions inside GitHub Actions, the pipeline only **creates Safe proposals**.
Execution happens later — through **Gnosis Safe**, **delegated signing via Lit Protocol Vincent**, or a **local KMS container** — ensuring that no private key ever lives in CI.

ZeroKey CI makes smart-contract deployment:
- 🔐 **Secure** – non-exportable keys, policy-guarded signing
- 🧩 **Auditable** – every PR is linked to its on-chain transaction
- ⚙️ **Developer-friendly** – runs free on any laptop or public CI
- 🌐 **Composable** – integrates with Hardhat 3, Blockscout, Envio, Lit Protocol
- 🧾 **Spec-first** – editor integration generates/validates deploy & policy specs

---

## 🧠 Architecture

Developer → Pull Request
↓
Hardhat 3 (compile / test)
↓
CI (GitHub Actions)
↓
Policy Gateway + SoftKMS / Vault / Cloud KMS
↓
Safe Transaction Proposal
↓
Owner or Lit delegate approves
↓
Execution → Blockscout & Envio Dashboard

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

## 📚 Next Steps
- Add full **Vincent UI** for per-function delegation
- Extend **OPA policies** for multi-network governance
- Package reusable **GitHub Action template** for public use
- Optional **ZK-proof plugin** for deploy-policy attestations

---

### 💡 Team
Built by **Susumu Tomita (たみぃ)** and collaborators
for **ETHOnline 2025**

<instructions>
- In the file `/Users/susumu/ethglobal/ZeroKeyCI/README.md`, find the bullet list under the line `ZeroKey CI makes smart-contract deployment:`. After the existing line `- 🌐 **Composable** – integrates with Hardhat 3, Blockscout, Envio, Lit Protocol`, insert a new bullet on the next line with exactly:
  `- 🧾 **Spec-first** – editor integration generates/validates deploy & policy specs`
- In the same file, locate the paragraph that ends with the sentence `Keys are non-exportable and use short-lived tokens, so ZeroKey CI can run **without any paid cloud dependency**.` Immediately after that paragraph, insert a blank line and then the following section verbatim:

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
