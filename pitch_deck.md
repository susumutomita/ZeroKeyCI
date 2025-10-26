---
marp: true
theme: uncover
class:
  - lead
  - invert
---

# 🛠 ZeroKey CI

- Smart Contract CI/CD
- Without Private Keys

---

## The Problem

Private keys in GitHub Actions = Security Risk

One leaked key = Game over

---

## Our Solution

No private keys in CI/CD

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

## Integration

Add GitHub Actions.yaml.

```yaml
- uses: susumutomita/ZeroKeyCI@main
  with:
    safe-address: ${{ vars.SAFE_ADDRESS }}
    network: base-sepolia
```

---

## Demo

Submit proposal from GitHub Actions.

---

## Technology

🔥 Hardhat
🔐 Gnosis Safe SDK
⚡ Lit Protocol PKP

---

## Thank You!
