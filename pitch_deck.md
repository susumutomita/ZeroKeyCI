---
marp: true
theme: uncover
class:
  - lead
  - invert
---

# 🛠 ZeroKey CI

**Smart Contract CI/CD**
**Without Private Keys**

ETHOnline 2025

---

## The Problem

Private keys in GitHub Actions = **Security Risk**

One leaked key = Game over

---

## Our Solution

**No private keys in CI/CD**

✅ CI creates proposal
✅ Safe owners sign
✅ Contract deploys

---

## How It Works

```
❌ Old: CI → Private Key → Deploy
✅ New: CI → Proposal → Safe → Deploy
```

---

## Real Impact

💰 Save **$177** per deployment
⚡ **10x faster** (30 min → 3 min)
🔐 **2-of-3 multisig** vs single key

---

## Technology

🔥 Hardhat 3
🔐 Gnosis Safe SDK
⚡ Lit Protocol PKP
🔍 Blockscout

---

## Prize Tracks

🏆 Lit Protocol - **$5,000**
🏆 Hardhat - **$5,000**
🏆 Blockscout - **$10,000**

---

## Integration

```yaml
- uses: susumutomita/ZeroKeyCI@main
  with:
    safe-address: ${{ vars.SAFE_ADDRESS }}
    network: base-sepolia
```

**3 minutes to setup**

---

## Demo

🌐 **zero-key-ci.vercel.app**

Try it in 3 minutes
No Safe setup needed

---

## What We Built

✅ Gas optimization (10 networks)
✅ Multi-chain support
✅ Team notifications
✅ Proxy deployments

---

## Market

**50,000+** smart contract repos
Growing security demand
Every Web3 team needs this

---

## Traction

✅ Production ready
✅ 683 tests passing
✅ Complete documentation
✅ Demo mode live

---

## Why We'll Win

Novel security model
Real cost savings ($177)
Deep sponsor integration
Production ready now

---

## Team

**Susumu Tomita (たみぃ)**

ETHOnline 2025

GitHub.com/susumutomita/ZeroKeyCI

---

## Thank You!

🚀 Try it: zero-key-ci.vercel.app
🔐 No private keys, ever

**Questions?**

---
