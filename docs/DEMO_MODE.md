# Demo Mode: Try ZeroKeyCI in 3 Minutes

**Want to try ZeroKeyCI without setting up your own Safe wallet?** Use our demo Safe address to understand the workflow before committing to production setup.

---

## 🎯 Demo Mode vs Production Mode

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| **Safe Address** | Use ZeroKeyCI's demo Safe | Create your own Safe wallet |
| **Setup Time** | ~3 minutes | ~12 minutes |
| **Purpose** | Learning and testing | Real deployments |
| **Security** | Shared demo wallet | Your own multisig |
| **Signing** | You sign proposals manually | You sign proposals manually |
| **Network** | Base Sepolia (testnet) | Any network |
| **Cost** | Free (testnet) | Real gas costs (mainnet) |

---

## 🚀 Quick Try (Demo Mode)

### Demo Safe Address

```
0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663
```

**Network:** Base Sepolia (testnet)
**Threshold:** 1-of-N (any authorized signer can execute)
**Purpose:** Educational demonstrations and testing

### Step 1: Fork Our Demo Template (1 minute)

```bash
# Clone the demo template
git clone https://github.com/susumutomita/zerokeyci-quickstart-template.git
cd zerokeyci-quickstart-template

# Create your own repository
gh repo create my-zerokeyci-demo --public --source=. --remote=origin --push
```

### Step 2: Configure GitHub (1 minute)

```bash
# Set the demo Safe address
gh variable set SAFE_ADDRESS --body "0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663"

# Set RPC URL (free public endpoint)
gh secret set BASE_SEPOLIA_RPC_URL --body "https://sepolia.base.org"

# Verify
gh variable list
gh secret list
```

### Step 3: Create and Merge PR (1 minute)

```bash
# Create a feature branch
git checkout -b feat/my-first-deploy

# Make a small change
echo "# My First ZeroKeyCI Deploy" > README.md
git add README.md
git commit -m "feat: test ZeroKeyCI deployment"
git push -u origin feat/my-first-deploy

# Create and merge PR
gh pr create --title "Test ZeroKeyCI" --body "Testing deployment with demo Safe"
gh pr merge --merge
```

### Step 4: Sign the Proposal

1. **GitHub Actions runs** - Check the Actions tab
2. **Proposal created** - Check PR comments for Safe proposal link
3. **Open Safe UI**: Visit [app.safe.global](https://app.safe.global)
4. **Connect your wallet** (MetaMask)
5. **Switch to Base Sepolia**
6. **Load the demo Safe**: Enter `0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663`
7. **Add yourself as a signer** (if not already):
   - Settings → Owners → Add Owner
   - Enter your wallet address
   - Execute the transaction
8. **Sign the deployment proposal**:
   - Go to Transactions tab
   - Review the proposal
   - Click "Sign" and confirm in MetaMask
   - Click "Execute" (if threshold reached)

---

## ⚠️ Demo Mode Limitations

### What Demo Mode IS:

- ✅ A way to **learn** the ZeroKeyCI workflow
- ✅ A way to **test** your deployment setup
- ✅ Safe for **testnet experiments**
- ✅ Requires **manual signing** (you control your keys)

### What Demo Mode IS NOT:

- ❌ Suitable for **production** deployments
- ❌ Suitable for **mainnet** contracts
- ❌ Suitable for contracts with **real value**
- ❌ Fully automated (no auto-signing)

### Security Notice

**The demo Safe is shared among multiple users for educational purposes.**

- Anyone added as a signer can execute proposals
- Only use on testnets with test tokens
- Never deploy contracts with real value to the demo Safe
- Always create your own Safe for production use

---

## 📈 Upgrading to Production Mode

Once you've tested with demo mode, create your own Safe for production:

### Step 1: Create Your Own Safe (5 minutes)

1. Visit [app.safe.global](https://app.safe.global)
2. Connect your wallet
3. Select your target network (e.g., Base, Polygon, Ethereum mainnet)
4. Create new Safe:
   - **Threshold**: 2-of-3 (recommended for production)
   - **Owners**: Add team members' addresses
5. Copy your Safe address

### Step 2: Update GitHub Configuration (1 minute)

```bash
# Replace demo Safe with your own
gh variable set SAFE_ADDRESS --body "0xYourOwnSafeAddress"

# Update RPC URL for your network
gh secret set POLYGON_RPC_URL --body "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"
```

### Step 3: Update Workflow (1 minute)

Update `.github/workflows/deploy.yml`:

```yaml
jobs:
  deploy:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: polygon  # Change to your production network
      contract-name: YourContract
    secrets:
      rpc-url: ${{ secrets.POLYGON_RPC_URL }}
```

### Step 4: Deploy to Production

- Same workflow as demo mode
- Proposals go to YOUR Safe
- Only YOUR team can sign
- Full security and control

---

## 🔒 Why Your Own Safe for Production?

### Security Comparison

**Demo Safe (Shared):**
```
⚠️  Multiple users have signing access
⚠️  Anyone can add themselves as signer
⚠️  Not suitable for valuable contracts
✅  Great for learning and testing
```

**Your Own Safe (Production):**
```
✅  Only YOUR team has signing access
✅  2-of-3 or 3-of-5 threshold recommended
✅  Full control over governance
✅  Suitable for production deployments
```

### Attack Surface

**Demo Safe:**
- If 1 demo user's wallet is compromised → attacker can sign proposals
- No production use allowed

**Your Own Safe:**
- If 1 team member's wallet is compromised → still need 2+ signatures (with 2-of-3)
- Production-ready security

---

## 📚 Next Steps

### After Demo Mode

1. ✅ Understand the workflow: PR → CI creates proposal → Sign → Deploy
2. ✅ See it working: Actual testnet deployment
3. ✅ No private keys: Verified CI has no keys

### Ready for Production?

1. **Create your own Safe**: [SAFE_SETUP.md](./SAFE_SETUP.md)
2. **Configure multisig**: Add team members
3. **Set up for mainnet**: [Production checklist](./INTEGRATION_GUIDE.md#production-checklist)
4. **Deploy confidently**: Full security model

---

## 🆘 Troubleshooting Demo Mode

### "Cannot load Safe at this address"

**Cause:** Demo Safe might not be deployed on your selected network

**Fix:** Ensure you're on **Base Sepolia** testnet in Safe UI

### "You are not an owner of this Safe"

**Cause:** Your wallet address is not added as a signer

**Fix:**
1. Ask an existing demo Safe owner to add you, or
2. Create your own Safe (recommended for production)

### "Insufficient funds for gas"

**Cause:** Demo Safe needs testnet ETH

**Fix:**
1. Visit [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Request ETH for the demo Safe address
3. Wait ~5 seconds for confirmation

### "Proposal not appearing in Safe UI"

**Cause:** GitHub Actions workflow may have failed

**Fix:**
```bash
# Check workflow status
gh run list --limit 5

# View logs
gh run view <run-id> --log-failed
```

---

## 💡 FAQ

### Q: Is demo mode free?

**A:** Yes, completely free. Uses testnet tokens which have no real value.

### Q: Can I deploy to mainnet with demo Safe?

**A:** **NO.** Demo mode is ONLY for Base Sepolia testnet. Never use the demo Safe for mainnet.

### Q: Do I need to add myself as a Safe owner?

**A:** Yes. After the first deployment proposal is created, you'll need to:
1. Connect to the demo Safe in Safe UI
2. Add yourself as an owner
3. Then you can sign proposals

Alternatively, ask an existing owner to add you.

### Q: Will ZeroKeyCI auto-sign my proposals?

**A:** **NO.** You must sign proposals manually in Safe UI. This maintains the security model.

### Q: How do I migrate from demo to production?

**A:** Follow the "Upgrading to Production Mode" section above. Simply create your own Safe and update the GitHub variable.

### Q: Can I use demo Safe for hackathons?

**A:** Yes! Demo mode is perfect for hackathon submissions. Just make sure to document that you understand the production upgrade path.

---

## 📖 Related Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Complete beginner's guide
- **[Safe Setup Guide](./SAFE_SETUP.md)** - Create your own Safe wallet
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Advanced configuration
- **[Security Model](./SECURITY.md)** - Why this is secure

---

**Built for ETHOnline 2025** | [GitHub](https://github.com/susumutomita/ZeroKeyCI) | [Demo](https://zero-key-ci.vercel.app)
