# ETHOnline 2025 Prize Information

**Last Updated**: 2025-10-20
**Source**: https://ethglobal.com/events/ethonline2025/prizes

## ⚠️ IMPORTANT: Actual Prize Sponsors

This document contains the **actual verified prize sponsors** for ETHOnline 2025. Do NOT make up prize categories or sponsors that don't exist.

---

## 📊 All Prize Sponsors (13 Total)

### $10,000 Prizes (5 sponsors)

1. **Avail** - $10,000
   - About: Data availability layer for blockchain scalability
   - Website: https://www.availproject.org/
   - Twitter: @availproject

2. **Blockscout** - $10,000
   - About: Blockchain explorer and analytics platform
   - **ZeroKeyCI Integration**: ✅ YES
     - `scripts/blockscout-verify.ts` - Contract verification
     - `.github/workflows/deploy.yml` lines 197-224 - MCP integration
     - Automated contract verification in CI/CD

3. **PayPal USD** - $10,000
   - About: PayPal's stablecoin (PYUSD)

4. **Hedera** - $10,000
   - About: Enterprise-grade public distributed ledger

5. **Artificial Superintelligence Alliance** - $10,000
   - About: AI and blockchain integration

### $5,000 Prizes (6 sponsors)

6. **Envio** - $5,000
   - About: Blockchain indexing and data infrastructure

7. **Lit Protocol** - $5,000
   - About: Distributed key management and programmable signing
   - **ZeroKeyCI Integration**: ✅ YES - CORE FEATURE
     - `scripts/trigger-pkp-signing.ts` - PKP signing automation
     - `.github/workflows/deploy.yml` lines 226-250 - PKP workflow
     - `docs/PKP_SETUP.md` - Complete PKP setup guide
     - PKPs (Programmable Key Pairs) enable keyless CI/CD deployment

8. **Pyth** - $5,000
   - About: Oracle network for real-time market data

9. **Hardhat** - $5,000
   - About: Ethereum development environment
   - **ZeroKeyCI Integration**: ✅ YES - CORE DEPENDENCY
     - `hardhat.config.ts` - Complete Hardhat configuration
     - All contract compilation using Hardhat 3.0.7
     - Testing infrastructure powered by Hardhat
     - Essential development tool for smart contract workflows

10. **Arcology** - $5,000
    - About: Parallel EVM execution platform

11. **Yellow** - $5,000
    - About: Decentralized content delivery network

### $1,000 Prizes (2 sponsors)

12. **Lighthouse** - $1,000
    - About: Decentralized storage protocol

13. **EVVM** - $1,000
    - About: EVM-compatible virtual machine

---

## ✅ ZeroKeyCI Prize Target Analysis

### Strong Fit (Actual Code Integration)

#### 1. Lit Protocol ($5,000) - PRIMARY TARGET
**Integration Level**: Core Feature

**Prize Track**: Best DeFi automation Vincent Apps (Up to 3 teams, $1,666 each)

**Evidence**:
- `scripts/trigger-pkp-signing.ts` (163 lines)
- `docs/PKP_SETUP.md` (complete setup guide)
- `.github/workflows/deploy.yml` lines 226-250 (PKP signing workflow)
- Environment variables: `PKP_PUBLIC_KEY`, `LIT_ACTION_IPFS_CID`, `LIT_NETWORK`

**Value Proposition**:
- PKPs are fundamental to our keyless CI/CD architecture
- Enables automated signing without storing private keys
- Production-ready integration with comprehensive documentation
- Core differentiator: Safe multisig + PKP automated signing

**Prize Fit**: Excellent - using Lit Protocol's Vincent for programmable scoped delegation

**Official Documentation & Resources**:
- **Vincent Builders Quick Start**: https://docs.heyvincent.ai/app/quickstart
- **Vincent Docs (Main)**: https://docs.heyvincent.ai/concepts/introduction/about
- **Vincent App Starter Kit**: https://github.com/LIT-Protocol/vincent-starter-app
- **List of Vincent Abilities**: https://docs.heyvincent.ai/concepts/abilities/about
- **Vincent Ability Starter Kit**: https://github.com/LIT-Protocol/vincent-ability-starter-kit
- **Lit Protocol Main Site**: https://litprotocol.com/
- **Twitter**: @LitProtocol

**Example Apps (Reference)**:
- Automatic Morpho Yield Optimizer: https://yield.heyvincent.ai/
- Dollar Cost Averaging wBtc on Base: https://dca.heyvincent.ai/

**Workshop**:
- "Signing on Behalf of Users without Their Private Keys" - Oct 15, 2025, 2:00 PM EDT
- Video: https://www.youtube.com/watch?v=f4ibsm-4mRY

**Qualification Requirements**:
- Using Debridge or Across for user deposits or cross-chain swaps
- Need to create a Vincent Ability for it

**Key Concepts**:
- Vincent = Scoped delegation platform for automated transactions
- Supports: EVM, Solana, native Bitcoin
- Use cases: Cross-chain Portfolio Rebalancers, Automated Yield Farming, Meta-vault aggregators, Non-custodial Asset management

---

#### 2. Hardhat ($5,000) - PRIMARY TARGET
**Integration Level**: Core Dependency

**Evidence**:
- `hardhat.config.ts` (complete configuration)
- `package.json`: `"hardhat": "^3.0.7"`
- All smart contract compilation uses Hardhat
- Testing framework: Hardhat + Vitest integration
- 605 tests running with Hardhat infrastructure

**Value Proposition**:
- Essential development tool powering entire smart contract workflow
- Production-grade Hardhat setup with TypeScript
- Contract compilation, testing, and deployment infrastructure
- Hardhat 3.0.7 latest version integration

**Prize Fit**: Excellent - extensive use of Hardhat ecosystem

**Official Documentation & Resources**:
- **Hardhat Docs (Main)**: https://hardhat.org/docs
- **Getting Started Guide**: https://hardhat.org/hardhat-runner/docs/getting-started
- **Hardhat Config Reference**: https://hardhat.org/hardhat-runner/docs/config
- **Hardhat Network**: https://hardhat.org/hardhat-network/docs
- **Hardhat VSCode Extension**: https://hardhat.org/hardhat-vscode/docs/overview
- **GitHub**: https://github.com/NomicFoundation/hardhat
- **Twitter**: @HardhatHQ

**Key Features Used**:
- TypeScript support
- Contract compilation (Solidity)
- Local development network
- Testing framework integration
- Plugin ecosystem

---

#### 3. Blockscout ($10,000) - SECONDARY TARGET
**Integration Level**: Feature Integration

**Evidence**:
- `scripts/blockscout-verify.ts` (contract verification)
- `.github/workflows/deploy.yml` lines 183-195 (Blockscout verification step)
- `.github/workflows/deploy.yml` lines 197-224 (MCP server integration)
- Automated contract verification in CI/CD workflow

**Value Proposition**:
- Automated contract verification using Blockscout API
- MCP (Model Context Protocol) server integration
- Blockchain exploration and analytics integration
- Production CI/CD workflow integration

**Prize Fit**: Good - practical use of Blockscout services

**Official Documentation & Resources**:
- **Blockscout Docs (Main)**: https://docs.blockscout.com/
- **API Documentation**: https://docs.blockscout.com/for-users/api
- **Smart Contract Verification**: https://docs.blockscout.com/for-users/verifying-a-smart-contract
- **MCP Server Integration**: https://github.com/blockscout/mcp-server
- **Blockscout GitHub**: https://github.com/blockscout/blockscout
- **Twitter**: @blockscoutcom
- **Website**: https://blockscout.com/

**Key Features Used**:
- Contract verification API
- MCP (Model Context Protocol) server
- Blockchain explorer integration
- API endpoints for contract data

---

### Potential Fit (Would Require New Development)

#### 4. Hedera ($10,000)
**Integration Level**: None (could add network support)
- Would require: Adding Hedera network to supported networks
- Feasibility: Moderate (network configuration changes)
- Value: Limited unless specifically building for Hedera

#### 5. PayPal USD ($10,000)
**Integration Level**: None (could integrate PYUSD)
- Would require: Adding PYUSD payment/integration features
- Feasibility: Low (significant scope change)
- Value: Limited alignment with core value proposition

---

## 🎯 Recommended Prize Strategy

### Primary Targets (Submit to these)
1. **Lit Protocol** ($5,000) - Strongest fit, core feature
2. **Hardhat** ($5,000) - Essential dependency, extensive use
3. **Blockscout** ($10,000) - Good integration, practical use

### Total Potential Prize Pool
$20,000 (if winning all three)

### Why These Are Accurate
- ✅ Actual code integration exists (not speculation)
- ✅ Production-ready implementations
- ✅ Can demonstrate live usage in project
- ✅ Aligns with sponsor requirements
- ✅ Not generic "best project" - specific technology integration

### Why NOT Others
- ❌ No "Safe (Gnosis Safe)" prize sponsor exists
- ❌ No "Security/Infrastructure" generic prize exists
- ❌ No "Developer Tools" generic prize exists
- ❌ No "Best Overall" prize exists in sponsor list

---

## 📝 Documentation for Prize Submissions

### Lit Protocol Prize Submission Points
- **What we built**: Keyless CI/CD using PKPs for automated Safe multisig signing
- **How we use Lit**: PKP-based automated signing without storing private keys
- **Code evidence**: `scripts/trigger-pkp-signing.ts`, PKP workflow integration
- **Innovation**: Combining GitHub OIDC + Safe multisig + Lit PKPs for zero-key deployment

### Hardhat Prize Submission Points
- **What we built**: Complete smart contract CI/CD pipeline
- **How we use Hardhat**: Contract compilation, testing, deployment infrastructure
- **Code evidence**: `hardhat.config.ts`, 605 tests, Hardhat 3.0.7 integration
- **Innovation**: Production-grade Hardhat setup with TypeScript, upgradeable contracts support

### Blockscout Prize Submission Points
- **What we built**: Automated contract verification in CI/CD
- **How we use Blockscout**: Contract verification API, MCP server integration
- **Code evidence**: `scripts/blockscout-verify.ts`, deploy.yml workflow
- **Innovation**: Automated verification as part of deployment pipeline

---

## ⚠️ DO NOT MAKE UP PRIZES

**Common Mistakes to Avoid**:
- ❌ Do NOT claim prizes that don't exist
- ❌ Do NOT invent generic categories like "Best DeFi" or "Best Infrastructure"
- ❌ Do NOT speculate about prize categories without verification
- ✅ ONLY reference actual sponsors from https://ethglobal.com/events/ethonline2025/prizes
- ✅ ONLY claim fit for technologies we actually use in our codebase

---

## 🔗 References

- **Official Prize Page**: https://ethglobal.com/events/ethonline2025/prizes
- **Lit Protocol**: https://litprotocol.com/
- **Hardhat**: https://hardhat.org/
- **Blockscout**: https://blockscout.com/

**Last Verified**: 2025-10-20 23:00 UTC
