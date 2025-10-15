# Gnosis Safe Setup Guide

## Do You Need a Hardware Wallet?

**Short answer: No, hardware wallets are NOT required.**

**However, they are HIGHLY RECOMMENDED for production deployments.**

## Safe Owner Options

### Option 1: MetaMask (Browser Extension)

**Difficulty:** ⭐ Easy
**Security:** ⚠️ Medium (hot wallet)
**Cost:** Free
**Use case:** Testing, development, low-value testnet deployments

**Setup:**
1. Install MetaMask browser extension
2. Create wallet or import existing
3. Connect to Safe at https://app.safe.global
4. Add MetaMask address as Safe owner

**Pros:**
- Free and easy to set up
- Good for testing and development
- Fast signing experience

**Cons:**
- Private key stored on computer
- Vulnerable to malware
- Not recommended for production mainnet

### Option 2: Safe Mobile App

**Difficulty:** ⭐⭐ Easy
**Security:** ⭐⭐ Medium-High
**Cost:** Free
**Use case:** Production deployments, mobile-first users

**Setup:**
1. Download Safe mobile app (iOS/Android)
2. Create Safe wallet in app
3. Add additional owners via web interface

**Pros:**
- Free
- Keys stored on mobile device
- Biometric authentication
- Good security model

**Cons:**
- Requires smartphone
- Less convenient than hardware wallet
- Depends on phone security

**Download:**
- iOS: https://apps.apple.com/app/safe-multisig/id1515759131
- Android: https://play.google.com/store/apps/details?id=io.gnosis.safe

### Option 3: WalletConnect (Any Mobile Wallet)

**Difficulty:** ⭐⭐ Easy
**Security:** Varies by wallet
**Cost:** Free
**Use case:** If you already have a mobile wallet

**Setup:**
1. Use any WalletConnect-compatible wallet
2. Scan QR code from Safe web interface
3. Sign transactions on your mobile device

**Compatible wallets:**
- Trust Wallet
- Rainbow
- Argent
- Zerion
- And 300+ others

### Option 4: Hardware Wallet (Ledger/Trezor)

**Difficulty:** ⭐⭐⭐ Moderate
**Security:** ⭐⭐⭐⭐⭐ Highest
**Cost:** $50-200 USD
**Use case:** Production mainnet, high-value deployments

**Setup:**
1. Purchase Ledger or Trezor hardware wallet
2. Set up device with PIN and recovery phrase
3. Install Ethereum app on device
4. Connect to Safe via USB or Bluetooth
5. Add hardware wallet address as Safe owner

**Pros:**
- Highest security (keys never leave device)
- Industry standard for production
- Protects against malware
- Recovery phrase backup

**Cons:**
- Costs money ($50-200)
- Requires physical device
- Slightly slower signing process
- Learning curve

**Recommended devices:**
- Ledger Nano S Plus ($79): https://shop.ledger.com
- Ledger Nano X ($149): Bluetooth support
- Trezor Model One ($69): https://trezor.io
- Trezor Model T ($219): Touchscreen

### Option 5: Smart Contract Wallets (Account Abstraction)

**Difficulty:** ⭐⭐⭐ Advanced
**Security:** ⭐⭐⭐⭐ High
**Cost:** Free (gas costs)
**Use case:** Advanced users, social recovery

**Options:**
- Argent wallet (built-in social recovery)
- Braavos (StarkNet)
- Soul Wallet (ERC-4337)

**Pros:**
- Social recovery (no seed phrase)
- Gasless transactions possible
- Advanced features

**Cons:**
- Newer technology
- Less widespread support
- More complex setup

## Recommended Setup by Environment

### Testnet (Sepolia/Goerli)

**Recommended:**
- 1-of-2 multisig
- Owner 1: MetaMask (free, fast)
- Owner 2: Safe Mobile App (free, secure)

**Why:**
- No real money at risk
- Fast iteration
- Free to set up
- Easy testing

### Production (Mainnet)

**Recommended:**
- 2-of-3 multisig (minimum)
- Owner 1: Hardware wallet (Ledger/Trezor)
- Owner 2: Hardware wallet (different brand)
- Owner 3: Safe Mobile App (backup)

**Why:**
- Maximum security
- No single point of failure
- Protects against device compromise
- Industry best practice

### Enterprise

**Recommended:**
- 3-of-5 multisig
- Owner 1-3: Hardware wallets (different team members)
- Owner 4: Safe Mobile App
- Owner 5: WalletConnect (emergency backup)

**Why:**
- Separation of duties
- Redundancy
- Compliance requirements
- Risk distribution

## Creating Your First Safe

### Step 1: Choose Network

Visit https://app.safe.global and select network:
- **Sepolia:** Testing (free testnet ETH)
- **Mainnet:** Production (real ETH)
- **Polygon:** L2 (lower fees)
- **Arbitrum:** L2 (lower fees)
- **Optimism:** L2 (lower fees)

### Step 2: Connect Wallet

Choose your connection method:
1. Click "Connect Wallet"
2. Select wallet type:
   - MetaMask
   - WalletConnect (mobile wallets)
   - Hardware wallet (Ledger/Trezor)
   - Safe Mobile App

### Step 3: Create Safe

1. Click "Create Safe"
2. Enter Safe name (e.g., "ZeroKeyCI Testnet")
3. Add owner addresses:
   - Your address (already added)
   - Add other owner addresses
4. Set threshold (e.g., 2-of-3)
5. Review and deploy

**Deployment cost:**
- Testnet: Free (use faucet for gas)
- Mainnet: ~0.01-0.03 ETH (~$30-90)

### Step 4: Fund Safe (Optional)

For testnet:
```bash
# Get Sepolia ETH from faucet
https://sepoliafaucet.com/
# Send to Safe address
```

For mainnet:
```bash
# Send ETH to Safe address from your wallet
# Safe needs ETH for deployment gas costs
```

### Step 5: Add to GitHub Secrets

```yaml
# In GitHub repository settings
SAFE_ADDRESS: "0xYourSafeAddressHere"
```

This is public information (Safe addresses are on-chain), but keep it organized.

## Signing Workflow

### Using Safe Web Interface

1. Go to https://app.safe.global
2. Connect wallet
3. Select your Safe
4. Go to "Transactions" → "New transaction"
5. Import proposal JSON (from GitHub Actions artifact)
6. Review transaction details
7. Click "Sign"
8. Confirm in your wallet (MetaMask/hardware wallet/mobile)

### Using Safe CLI

```bash
# Install Safe CLI
npm install -g @safe-global/safe-cli

# Initialize
safe-cli --safe 0xYourSafeAddress

# Import proposal
safe-cli import-transaction proposal.json

# Sign
safe-cli sign-transaction TX_HASH

# Execute (when threshold reached)
safe-cli execute-transaction TX_HASH
```

## Cost Comparison

| Option | Initial Cost | Per-Transaction Cost | Security Level |
|--------|-------------|----------------------|----------------|
| MetaMask | $0 | Gas only | Medium |
| Safe Mobile | $0 | Gas only | High |
| WalletConnect | $0 | Gas only | Varies |
| Ledger Nano S Plus | $79 | Gas only | Very High |
| Ledger Nano X | $149 | Gas only | Very High |
| Trezor Model One | $69 | Gas only | Very High |
| Trezor Model T | $219 | Gas only | Very High |

**Note:** All options pay the same gas costs for Safe transactions. Hardware wallet cost is one-time.

## FAQ

### Q: Can I use the same hardware wallet for multiple Safes?

**A:** Yes! One hardware wallet can be an owner on multiple Safes.

### Q: Can I add hardware wallet owners later?

**A:** Yes! You can add/remove owners anytime through Safe governance. Requires existing owner signatures.

### Q: What happens if I lose my hardware wallet?

**A:** If you have a multisig (2-of-3), other owners can still sign. Then remove the lost device and add a new owner. This is why multisig is important!

### Q: Can I use the same address for multiple owner slots?

**A:** No. Each owner must be a unique address for security.

### Q: Is Safe Mobile App secure enough for production?

**A:** Yes, if used properly:
- Enable biometric authentication
- Keep phone OS updated
- Don't install suspicious apps
- Use in combination with other owners (2-of-3)

### Q: Can I use MetaMask for production?

**A:** Not recommended for mainnet production, but acceptable for:
- Testnet deployments
- Low-value operations
- As 1 of many owners in a 3-of-5 setup

### Q: Do I need to buy all 3 hardware wallets upfront?

**A:** No! Start with:
1. Create Safe with MetaMask/Mobile (free)
2. Test thoroughly on testnet
3. Add hardware wallet owners before mainnet
4. Gradually upgrade security as needed

### Q: Can I use EOA (regular wallet) for signing?

**A:** Yes! Safe owners can be:
- Regular wallets (EOA) - MetaMask, hardware wallet, mobile wallet
- Smart contract wallets - Other Safes, AA wallets
- Mix of both

### Q: What's the minimum setup for production?

**A:** Absolute minimum:
- 2-of-3 multisig
- At least 1 hardware wallet
- At least 1 mobile wallet (backup)

**Recommended:**
- 2-of-3 or 3-of-5
- 2+ hardware wallets
- 1 mobile wallet backup

## Getting Started: Free Testnet Setup

Want to try ZeroKeyCI without buying anything?

### 5-Minute Free Setup

1. **Install MetaMask**
   - Free browser extension
   - https://metamask.io

2. **Get Testnet ETH**
   - https://sepoliafaucet.com
   - Request free Sepolia ETH

3. **Create Safe**
   - https://app.safe.global
   - Connect MetaMask
   - Create 1-of-1 Safe (easiest for testing)

4. **Add to GitHub**
   ```yaml
   SAFE_ADDRESS: "0xYourSafeAddress"
   SEPOLIA_RPC_URL: "https://sepolia.infura.io/v3/..."
   ```

5. **Deploy Test Contract**
   - Open PR with "deploy" label
   - CI creates proposal
   - Sign in Safe
   - Contract deploys!

No hardware wallet needed for testing!

## Production Migration Path

### Phase 1: Testing (Free)
- Use MetaMask + Safe Mobile
- Deploy to Sepolia testnet
- Learn the workflow

### Phase 2: Upgrade Security ($0-150)
- Buy 1 hardware wallet
- Add as Safe owner
- Increase threshold to 2-of-3

### Phase 3: Production Ready ($150-300)
- Buy second hardware wallet
- 2-of-3 with dual hardware wallets
- Deploy to mainnet

### Phase 4: Enterprise ($300+)
- Third hardware wallet
- 3-of-5 multisig
- Distributed team access

## Resources

- **Safe Documentation:** https://docs.safe.global
- **Safe Web App:** https://app.safe.global
- **Hardware Wallet Guides:**
  - Ledger: https://www.ledger.com/academy
  - Trezor: https://trezor.io/learn
- **Safe Mobile App:**
  - iOS: https://apps.apple.com/app/safe-multisig/id1515759131
  - Android: https://play.google.com/store/apps/details?id=io.gnosis.safe
- **WalletConnect:** https://walletconnect.com

## Summary

**Do you need a hardware wallet?**

- ✅ For testing: No (use MetaMask/mobile)
- ⚠️ For production: Highly recommended
- 🚫 For enterprise: Yes (multiple required)

**Free options exist**, but **security scales with investment**.

Start free, upgrade as needed!
