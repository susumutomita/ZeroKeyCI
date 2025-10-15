# ZeroKeyCI Security Architecture

## Core Principle: Zero Private Keys in CI/CD

**ZeroKeyCI does NOT store or use private keys in CI/CD environments.**

This is the fundamental security principle that distinguishes ZeroKeyCI from traditional deployment systems.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
│                                                              │
│  ✅ Compiles contracts                                      │
│  ✅ Runs tests                                              │
│  ✅ Validates against OPA policies                          │
│  ✅ Creates Safe transaction PROPOSAL (unsigned)            │
│  ❌ NO PRIVATE KEYS                                         │
│  ❌ NO SIGNING                                              │
│  ❌ NO TRANSACTION EXECUTION                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
                [Proposal Artifact]
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Gnosis Safe Multisig                      │
│                                                              │
│  👤 Safe Owner 1 → Signs with hardware wallet/MetaMask     │
│  👤 Safe Owner 2 → Signs with hardware wallet/MetaMask     │
│  👤 Safe Owner 3 → Signs with hardware wallet/MetaMask     │
│                                                              │
│  When threshold reached (e.g., 2-of-3):                     │
│    → Transaction executes                                    │
│    → Contract deploys                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Management Models

### Current Implementation: Gnosis Safe Multisig

**How it works:**
1. CI creates an unsigned transaction proposal
2. Proposal uploaded as GitHub artifact
3. Safe owners manually review and sign
4. Execution happens only after threshold signatures

**Private key location:**
- ✅ Owner 1: Hardware wallet (Ledger/Trezor)
- ✅ Owner 2: MetaMask with hardware wallet
- ✅ Owner 3: Gnosis Safe mobile app
- ❌ NOT in GitHub Secrets
- ❌ NOT in CI environment
- ❌ NOT in codebase

**Security benefits:**
- Multi-party approval required
- Keys never exposed to CI/CD
- Audit trail via Safe transaction history
- Revocable access (remove owner from Safe)

### Future Options (Not Yet Implemented)

#### Option 1: Lit Protocol Vincent (Delegated Signing)

Planned feature for automated signing with policy restrictions.

**How it would work:**
1. CI creates proposal with specific constraints
2. Lit Protocol Vincent validates against policy
3. Vincent uses distributed key shares (no single private key)
4. Automatic execution if policy allows

**Use case:** Automated deployments with policy guardrails

#### Option 2: Cloud KMS (AWS/GCP/Azure)

Planned integration for enterprise users.

**How it would work:**
1. CI creates proposal
2. Proposal sent to KMS for signing
3. KMS validates IAM permissions
4. KMS signs with non-exportable key
5. Signed transaction submitted

**Use case:** Enterprise compliance requirements

#### Option 3: SoftKMS (Local Container)

Planned for development/testing.

**How it would work:**
1. Local Docker container with isolated keystore
2. Keys stored in encrypted volume
3. API for signing (localhost only)
4. For testing only, not production

**Use case:** Local development and testing

## What's NOT Stored in CI/CD

### ❌ Private Keys

- Never stored in GitHub Secrets
- Never passed as environment variables
- Never written to disk in CI

### ❌ Mnemonics/Seed Phrases

- Not used anywhere in the system
- Not required for proposal creation

### ❌ Keystore Files

- No encrypted keystore files
- No password-protected keys

## What IS Stored in CI/CD

### ✅ Safe Address (Public Information)

```yaml
# GitHub Secret: SAFE_ADDRESS
SAFE_ADDRESS: "0x1234567890123456789012345678901234567890"
```

This is a public Ethereum address, not a secret. Anyone can see Safe addresses on-chain.

### ✅ RPC URLs (Infrastructure)

```yaml
# GitHub Secret: SEPOLIA_RPC_URL
SEPOLIA_RPC_URL: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
```

RPC URLs are infrastructure endpoints, not keys. They:
- Allow reading blockchain state
- Cannot sign transactions
- Should be rate-limited per API key
- Can be rotated without changing keys

### ✅ Deployment Configuration (Public)

```yaml
# .zerokey/deploy.yaml (committed to repo)
network: sepolia
contract: ExampleUUPS
signers:
  threshold: 2
  addresses:
    - "0xOwner1Address"
    - "0xOwner2Address"
```

All public information. No secrets.

## Security Boundaries

### Boundary 1: CI Environment

**Can:**
- Read blockchain state via RPC
- Compile contracts
- Create unsigned proposals
- Run tests and validations

**Cannot:**
- Sign transactions
- Execute transactions
- Access private keys
- Modify Safe configuration

### Boundary 2: Safe Owners

**Can:**
- Review proposals
- Sign with personal keys
- Execute transactions
- Add/remove owners

**Cannot:**
- Bypass threshold requirements
- Execute without other signers
- Access other owners' keys

### Boundary 3: OPA Policies

**Can:**
- Reject invalid proposals
- Enforce deployment rules
- Validate configuration

**Cannot:**
- Sign transactions
- Override Safe owners
- Access keys

## Attack Surface Analysis

### ✅ Protected Against

1. **Compromised CI/CD:**
   - No keys to steal
   - Can only create proposals
   - Safe owners must still approve

2. **Insider Threat:**
   - Single developer cannot deploy alone
   - Requires threshold signatures
   - Audit trail in Safe

3. **Supply Chain Attack:**
   - Compromised dependencies cannot sign
   - Owners review actual transaction data
   - Safe UI shows decoded transaction

4. **Credential Leakage:**
   - No credentials to leak
   - RPC keys have limited scope
   - Can be rotated without key changes

### ⚠️ Remaining Risks

1. **Safe Owner Compromise:**
   - Mitigation: Use hardware wallets
   - Mitigation: Higher threshold (3-of-5)
   - Mitigation: Regular owner rotation

2. **Social Engineering:**
   - Mitigation: Owner training
   - Mitigation: Manual review process
   - Mitigation: Transaction simulation

3. **OPA Policy Bypass:**
   - Mitigation: Policy review process
   - Mitigation: Version control for policies
   - Mitigation: Multiple policy layers

## Comparison with Traditional Approaches

### ❌ Traditional: Private Key in GitHub Secrets

```yaml
# DON'T DO THIS
DEPLOYER_PRIVATE_KEY: "0xabcd1234..." # ❌ DANGEROUS
```

**Problems:**
- Single point of failure
- All GitHub admins can access
- Leaked in logs/errors
- No revocation possible
- No multi-party approval

### ✅ ZeroKeyCI: Safe Multisig

```yaml
# DO THIS
SAFE_ADDRESS: "0x1234..." # ✅ SAFE (public address)
```

**Benefits:**
- Multiple approvers required
- Keys stay with owners
- Hardware wallet support
- Audit trail
- Revocable access

## Audit Trail

Every deployment has complete traceability:

1. **GitHub PR:**
   - Code changes
   - Review comments
   - Approval timestamps

2. **GitHub Actions:**
   - Compilation logs
   - Test results
   - OPA validation output
   - Proposal artifact

3. **Safe Transaction:**
   - Proposal details
   - Signer addresses
   - Signature timestamps
   - Execution タイムスタンプ

4. **On-Chain:**
   - Transaction hash
   - Block number
   - Gas used
   - Contract address

## Security Best Practices

### For CI/CD Setup

1. **Minimize Secrets:**
   - Only store Safe address and RPC URLs
   - Never store private keys
   - Use read-only RPC endpoints when possible

2. **OPA Policies:**
   - Require mainnet audits
   - Enforce gas limits
   - Validate signer thresholds
   - Prohibit private keys in configuration

3. **GitHub Actions:**
   - Use minimal permissions
   - Pin action versions
   - Review workflow changes carefully
   - Enable branch protection

### For Safe Owners

1. **Use Hardware Wallets:**
   - Ledger or Trezor recommended
   - Never use hot wallets for production
   - Keep firmware updated

2. **Verify Transactions:**
   - Always review in Safe UI
   - Check contract addresses
   - Verify function signatures
   - Simulate before signing

3. **Operational Security:**
   - Separate test and production Safes
   - Use different owners for different environments
   - Regular security training
   - Incident response plan

### For Contract Developers

1. **Testing:**
   - 100％ code coverage
   - Integration tests
   - Upgrade tests (for UUPS)
   - Gas estimation

2. **Auditing:**
   - External security audit for mainnet
   - Automated security tools (Slither, Mythril)
   - Peer review process

3. **Documentation:**
   - Clear deployment instructions
   - Risk assessment
   - Rollback procedures

## Incident Response

### If CI/CD is Compromised

1. **Immediate Actions:**
   - No private keys to rotate ✅
   - Review pending Safe transactions
   - Check recent proposal artifacts
   - Verify no unauthorized proposals signed

2. **Investigation:**
   - Audit GitHub Actions logs
   - Review recent PR merges
   - Check policy changes

3. **Recovery:**
   - No keys to regenerate ✅
   - Update RPC endpoints if needed
   - Review and update OPA policies
   - Continue normal operations

### If Safe Owner Key is Compromised

1. **Immediate Actions:**
   - Remove compromised owner from Safe
   - Cancel any pending transactions
   - Add new owner address

2. **Investigation:**
   - Review Safe transaction history
   - Check for unauthorized transactions
   - Identify compromise source

3. **Recovery:**
   - Replace hardware wallet if needed
   - Update Safe owner list
   - Notify other owners

## Compliance and Governance

### SOC 2 / ISO 27001

ZeroKeyCI architecture supports compliance:

- ✅ Separation of duties (multi-sig)
- ✅ Audit logging (GitHub + Safe)
- ✅ Access control (threshold signatures)
- ✅ Key management (no keys in CI)

### Regulatory Requirements

Suitable for regulated environments:

- No custodial key management
- Complete transaction history
- Multi-party approval
- Audit trail retention

## Frequently Asked Questions

### Q: How does ZeroKeyCI deploy without private keys?

**A:** It doesn't deploy directly. It creates Safe transaction **proposals** that must be signed by Safe owners who hold the actual private keys.

### Q: What if all Safe owners are unavailable?

**A:** Have backup owners and document threshold requirements. Consider time-locked recovery mechanisms via Safe Guards.

### Q: Can't attackers still modify the proposal?

**A:** Yes, but Safe owners review the actual transaction data before signing. The Safe UI shows decoded contract calls, making malicious changes visible.

### Q: What about automated deployments?

**A:** Use Lit Protocol Vincent (planned) for policy-constrained automated signing, or integrate with Cloud KMS with strict IAM policies.

### Q: How do you test deployments?

**A:** Use testnet Safes with lower thresholds (1-of-2) for faster iteration. Production uses higher thresholds (2-of-3 or 3-of-5).

### Q: What about gas price spikes?

**A:** OPA policies can enforce maximum gas prices. Integrate Pyth price feeds for automatic pause on spikes.

## Resources

- **Gnosis Safe Docs:** https://docs.safe.global
- **OPA Documentation:** https://www.openpolicyagent.org/docs/
- **Hardware Wallet Guide:** https://support.ledger.com/
- **Ethereum Security:** https://ethereum.org/en/developers/docs/smart-contracts/security/

## License

MIT License - See LICENSE file for details
