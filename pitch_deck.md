---
marp: true
theme: uncover
class:
  - lead
  - invert
---

# 🛠 ZeroKey CI

**Key-less CI/CD for Smart Contracts**

> ETHOnline 2025 Submission

---

## The Problem

**Every Web3 team faces the same dilemma:**

Deploy fast with keys in CI (insecure)
vs.
Deploy manually (slow, error-prone)

---

## The Problem (cont'd)

**Traditional CI/CD Security Risks:**

- 🔴 Private keys in GitHub Secrets
- 🔴 Single compromised account = full treasury access
- 🔴 SolarWinds-style breach → stolen keys
- 🔴 No audit trail, no rollback

**One leaked key = game over**

---

## Our Solution

**ZeroKeyCI**: Deploy smart contracts through GitHub Actions **without storing private keys anywhere**.

Gnosis Safe multisig owners approve deployments.

**No keys in code, no keys in secrets, no keys in CI.**

---

## How It Works

```
❌ Traditional:  CI → Private Key → Sign → Broadcast → Deploy
✅ ZeroKeyCI:    CI → Create Proposal → Owners Sign → Execute
```

**Separation of build and execution**

---

## Workflow in 6 Steps

1. Developer merges PR
2. GitHub Actions runs (compile, test, validate)
3. Creates Safe proposal (unsigned transaction)
4. Posts as PR comment (review bytecode, gas costs)
5. Owners sign & execute (multisig approval)
6. Contract deployed (full audit trail)

---

## Key Innovation

**CI/CD does NOT deploy.**
**It only creates proposals.**

- 🔐 NO private keys in CI/CD
- ✅ Multisig approval required (2-of-3)
- 📝 Complete audit trail (PR → blockchain)
- 🔍 OPA policy validation
- 🛡️ Optional Lit Protocol PKP automation

---

## Real-World Impact

**Gas Cost Savings:**
- Multi-network analysis saves **$177 per deployment**
- Timing optimization saves **$38 per deployment**
- Automatic network comparison across 10 chains

**Time Savings:**
- 30 minutes manual → **3 minutes automated**
- **10x faster** deployment cycle

---

## Real-World Impact (cont'd)

**Security Improvement:**

**Before (Private Keys):**
- Single compromised account = full treasury access
- Limited audit trail
- No rollback once broadcast

**After (ZeroKeyCI Multisig):**
- Need 2+ of 3 accounts (significantly harder)
- Complete audit trail (PR → CI → Safe → On-chain)
- Proposals can be rejected before execution

---

## Technology Stack

**Built with ETHOnline 2025 Sponsor Tech:**

- 🔥 Hardhat 3 → Compile, test, simulate
- 🔐 Gnosis Safe SDK → Deployment proposals
- ⚡ Lit Protocol PKP → Automated conditional signing
- 🔍 Blockscout Autoscout → Instant verification
- 📊 Envio HyperIndex → Real-time monitoring
- 🛡️ Open Policy Agent → Policy enforcement

---

## Prize Track Integration

**🏆 Lit Protocol ($5,000)**
- PKP-based automated signing
- Distributed key security
- No private keys ever exposed

**🏆 Hardhat ($5,000)**
- All contracts developed with Hardhat
- 605 tests running with Hardhat
- Complete compilation & testing workflow

---

## Prize Track Integration (cont'd)

**🏆 Blockscout ($10,000)**
- Automated contract verification
- MCP server integration
- Explorer verification in CI/CD

**📊 Envio**
- Real-time deployment monitoring
- Transaction indexing
- Event tracking dashboard

---

## 3-Minute Integration

```yaml
# .github/workflows/deploy.yml
- uses: susumutomita/ZeroKeyCI@main
  with:
    safe-address: ${{ vars.SAFE_ADDRESS }}
    network: base-sepolia
    contract-name: MyContract
    verify-blockscout: true
    rpc-url: ${{ secrets.BASE_SEPOLIA_RPC_URL }}
```

**That's it. No private keys in CI. Ever.**

---

## Demo

**Live Demo:**
https://zero-key-ci.vercel.app

**Demo Mode:**
- Try full workflow in 3 minutes
- No Safe setup required
- Real testnet deployment
- Base Sepolia testnet

---

## What We Built for ETHOnline

**1. Automatic Gas Optimization**
- Real-time gas prices across 10 networks
- Multi-network cost comparison
- 6 types of optimization recommendations

**2. True Multi-Chain Support**
- 10 networks (Ethereum, Polygon, Arbitrum, etc.)
- Single YAML → deploy everywhere
- Deterministic addresses across chains

---

## What We Built (cont'd)

**3. Team Notifications**
- Slack/Discord webhooks
- Real-time status updates
- GitHub PR comments with gas analysis

**4. Upgradeable Contract Support**
- UUPS proxy deployment
- Transparent proxy with admin
- Safe upgrade validation

---

## What We Built (cont'd)

**5. Zero Private Keys**
- NO keys in CI/CD environments
- Gnosis Safe multisig approval
- Lit Protocol PKP automation
- Full audit trail

**6. One-Click GitHub Integration**
- Auto-generate workflow PR
- Zero manual configuration
- Ready in 3 minutes

---

## Market Opportunity

**Target Users:**

- Web3 protocols deploying frequently
- DeFi teams with security requirements
- DAOs with multisig governance
- Any team tired of manual deployments

**Total Addressable Market:**
- 50,000+ smart contract repositories on GitHub
- Growing demand for secure CI/CD
- Increasing complexity of Web3 deployments

---

## Traction

**Current Status:**

- ✅ Production-ready GitHub Action
- ✅ 683 tests passing
- ✅ Multi-chain support (10 networks)
- ✅ Complete documentation
- ✅ Demo mode for easy onboarding

**Next Steps:**

- Expand to more networks
- Enhanced PKP automation
- Team management UI
- Enterprise features

---

## Why We'll Win

**Technical Excellence:**
- Deep integration with 4+ sponsor technologies
- Novel security model (zero private keys)
- Real cost savings ($177 per deployment)
- 10x faster than manual deployment

**Hackathon Fit:**
- Addresses real Web3 security problem
- Production-ready solution
- Clear demonstration of sponsor tech value
- Scalable to entire ecosystem

---

## Team

**Built by Susumu Tomita (たみぃ)**

**ETHOnline 2025 Submission**

**GitHub:** GitHub.com/susumutomita/ZeroKeyCI
**Demo:** zero-key-ci.vercel.app
**Docs:** Complete integration guides

---

## Thank You!

**Try ZeroKeyCI today:**

🚀 Quick Start: docs/QUICKSTART.md
⚡ Demo Mode: Try in 3 minutes
🔐 Security: No private keys, ever

**Questions?**

**Let's make Web3 CI/CD secure together.**

---
