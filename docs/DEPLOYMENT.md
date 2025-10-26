# ZeroKeyCI Production Deployment Guide

## Overview

ZeroKeyCI enables secure, keyless smart contract deployment through Gnosis Safe multisig proposals. This guide covers production deployment setup and best practices.

## Architecture

```
Developer → Pull Request → CI (GitHub Actions)
                            ↓
                  [Compile & Test Contracts]
                            ↓
                  [OPA Policy Validation]
                            ↓
              [Create Safe Transaction Proposal]
                            ↓
              [Upload Proposal as Artifact]
                            ↓
          Safe Owners Review & Sign → Execute
```

## Prerequisites

### 1. Gnosis Safe Setup

You need a deployed Gnosis Safe multisig wallet:

- **Testnet (Sepolia)**: For testing deployments
- **Mainnet**: For production deployments

**Create a Safe:**
1. Visit https://app.safe.global
2. Connect your wallet
3. Create new Safe with minimum 2-of-3 owners
4. Save the Safe address

### 2. GitHub Secrets Configuration

Configure the following secrets in your GitHub repository (`Settings → Secrets and variables → Actions`):

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SAFE_ADDRESS` | Your Gnosis Safe address | `0x1234...5678` |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint | `https://sepolia.infura.io/v3/YOUR_KEY` |
| `MAINNET_RPC_URL` | Mainnet RPC endpoint (production) | `https://mainnet.infura.io/v3/YOUR_KEY` |

**Security Notes:**
- NEVER store private keys in GitHub Secrets
- Use dedicated RPC endpoints with rate limiting
- Rotate RPC keys regularly

### 3. Repository Configuration

Create `.zerokey/deploy.yaml` in your repository:

```yaml
# Network to deploy to (sepolia, mainnet, polygon, arbitrum, optimism, base)
network: sepolia

# Contract to deploy
contract: ExampleUUPS

# Constructor arguments (if any)
constructorArgs: []

# Value to send with deployment (in wei)
value: "0"

# Gas configuration
gasLimit: 5000000
gasPrice: "20000000000" # 20 gwei

# Safe configuration
signers:
  threshold: 2
  addresses:
    - "0xYourSafeOwner1Address"
    - "0xYourSafeOwner2Address"
    - "0xYourSafeOwner3Address"

# Deployment metadata
metadata:
  description: "Deploy ExampleUUPS contract"
  requestor: "CI/CD Pipeline"
  auditReport: "https://example.com/audit-report"

# Deployment validations
validations:
  requireTests: true
  requireAudit: false # Set to true for mainnet
  minCoverage: 100
```

### 4. OPA Policy Configuration

The `.zerokey/policy.rego` file defines security rules:

```rego
package deployment

# Minimum signers required
min_signers := 2

# Allowed networks
allowed_networks := ["sepolia", "mainnet", "polygon"]

# Maximum gas limit
max_gas_limit := 10000000

# Deployment rules
default allow = false

allow {
  valid_network
  valid_signers
  valid_gas_limit
  no_private_keys
  valid_contract
}

# Deny mainnet without audit
deny[msg] {
  input.network == "mainnet"
  not input.validations.requireAudit
  msg := "Mainnet deployment requires security audit"
}
```

## Deployment Workflow

### Step 1: Create Feature Branch

```bash
git checkout -b feat/new-contract
```

### Step 2: Develop Smart Contract

Write your contract in `contracts/`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContract is UUPSUpgradeable, OwnableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
```

### Step 3: Write Comprehensive Tests

```typescript
// test/contracts/MyContract.test.ts
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("MyContract", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();
    const MyContract = await ethers.getContractFactory("MyContract");
    const contract = await upgrades.deployProxy(MyContract, [], {
      kind: "uups",
    });
    return { contract, owner, other };
  }

  it("should initialize correctly", async function () {
    const { contract, owner } = await loadFixture(deployFixture);
    expect(await contract.owner()).to.equal(owner.address);
  });

  // Add comprehensive tests...
});
```

### Step 4: Update Deployment Configuration

Update `.zerokey/deploy.yaml`:

```yaml
network: sepolia
contract: MyContract
constructorArgs: []
value: "0"
gasLimit: 5000000

signers:
  threshold: 2
  addresses:
    - "0xYourSafeOwner1Address"
    - "0xYourSafeOwner2Address"
    - "0xYourSafeOwner3Address"

metadata:
  description: "Deploy MyContract v1.0.0"
  requestor: "Development Team"
  jiraTicket: "PROJ-123"

validations:
  requireTests: true
  requireAudit: false
  minCoverage: 100
```

### Step 5: Create Pull Request

```bash
git add .
git commit -m "feat: add MyContract with comprehensive tests"
git push origin feat/new-contract
```

Create PR on GitHub:
- Fill in PR template
- Add clear description of contract functionality
- Link to any design documents or audits

### Step 6: Review and Merge

1. Code review by team members
2. CI tests must pass (tests, coverage, linting)
3. Merge to main

### Step 7: Trigger Deployment

Add `deploy` label to merged PR:
- This triggers the GitHub Actions deployment workflow
- Workflow will:
  1. Compile contracts
  2. Run all tests
  3. Validate against OPA policies
  4. Create Safe transaction proposal
  5. Upload proposal as artifact
  6. Comment on PR with proposal details

### Step 8: Review and Sign Proposal

1. Download proposal artifact from GitHub Actions
2. Safe owners review the proposal details
3. Import proposal into Safe UI at https://app.safe.global
4. Sign the proposal (requires threshold signatures)
5. Execute the transaction

### Step 9: Verify Deployment

After execution:

1. **Verify Contract on Etherscan/Blockscout:**
   ```bash
   npx hardhat verify --network sepolia DEPLOYED_ADDRESS
   ```

2. **Check Safe Transaction History:**
   - Visit Safe UI
   - Verify transaction execution
   - Check deployment address

3. **Run Post-Deployment Tests:**
   ```typescript
   // Run integration tests against deployed contract
   const contract = await ethers.getContractAt("MyContract", DEPLOYED_ADDRESS);
   expect(await contract.owner()).to.equal(SAFE_ADDRESS);
   ```

## Production Checklist

### Before Mainnet Deployment

- [ ] All tests passing with 100％ coverage
- [ ] Security audit completed and vulnerabilities addressed
- [ ] OPA policies updated for mainnet requirements
- [ ] Safe owners identified and available for signing
- [ ] RPC endpoints configured with redundancy
- [ ] Gas price monitoring in place
- [ ] Rollback plan documented
- [ ] Post-deployment monitoring configured

### Security Best Practices

1. **Never Use Private Keys in CI:**
   - ZeroKeyCI only creates proposals, never signs
   - All signing happens via Safe multisig

2. **Minimum 2-of-3 Multisig:**
   - Requires multiple approvals for deployments
   - Protects against single point of failure

3. **OPA Policy Validation:**
   - Enforces deployment rules at CI level
   - Prevents unauthorized or risky deployments

4. **Audit Trail:**
   - Every deployment linked to PR and commit
   - Full history in GitHub Actions artifacts

5. **Test Coverage:**
   - Require 100％ coverage for production contracts
   - Include upgrade tests for UUPS contracts

### Gas Optimization

1. **Monitor Gas Prices:**
   - Use Pyth Price Feeds for real-time gas monitoring
   - Pause deployments during gas spikes

2. **Optimize Deployment:**
   - Use CREATE2 for deterministic addresses
   - Consider EIP-1167 minimal proxies for clones

3. **Gas Limits:**
   - Set reasonable limits in OPA policies
   - Test deployment costs on testnet first

## Troubleshooting

### Deployment Workflow Fails

**Problem:** GitHub Actions workflow fails at compilation
**Solution:**
```bash
# Test locally first
npx hardhat compile
npx hardhat test
```

**Problem:** OPA validation fails
**Solution:**
```bash
# Validate policy locally
opa eval --data .zerokey/policy.rego --input .zerokey/deploy.yaml "data.deployment.allow"
```

**Problem:** Safe proposal creation fails
**Solution:**
- Check SAFE_ADDRESS is correct
- Verify RPC_URL is accessible
- Ensure network matches Safe deployment network

### Safe Execution Issues

**Problem:** Insufficient signers
**Solution:**
- Ensure threshold number of owners can sign
- Check owner addresses have access to signing keys

**Problem:** Transaction reverts
**Solution:**
- Test deployment on testnet first
- Check constructor arguments are correct
- Verify contract compilation matches proposal

### CI/CD Issues

**Problem:** Tests fail in CI but pass locally
**Solution:**
- Check Node.js/Bun versions match
- Verify dependencies are locked (use `bun install --frozen-lockfile`)
- Check for environment-specific issues

**Problem:** Coverage threshold not met
**Solution:**
```bash
# Generate coverage report locally
bun run test:coverage

# Identify untested code
open coverage/index.html
```

## Monitoring and Observability

### GitHub Actions Logs

- All workflow runs logged in GitHub Actions
- Proposal artifacts retained for 30 days
- PR comments provide audit trail

### Safe Transaction History

- View at https://app.safe.global
- Export transaction history for compliance
- Monitor pending transactions

### On-Chain Monitoring

Optional integrations:
- **Blockscout:** Contract verification (implementation exists, not yet tested in production)
- **The Graph:** Custom deployment indexing (future integration)

## Advanced Topics

### Multi-Environment Setup

Create environment-specific configurations:

```
.zerokey/
  ├── deploy.sepolia.yaml
  ├── deploy.mainnet.yaml
  └── policy.rego
```

Use GitHub Environments:
- Sepolia (automatic)
- Mainnet (manual approval required)

### Upgrade Workflow

For upgrading existing UUPS contracts:

```yaml
# .zerokey/upgrade.yaml
network: mainnet
action: upgrade
proxy: "0xExistingProxyAddress"
newImplementation: "0xNewImplementationAddress"

signers:
  threshold: 3  # Higher threshold for upgrades
  addresses:
    - "0xSafeOwner1"
    - "0xSafeOwner2"
    - "0xSafeOwner3"
    - "0xSafeOwner4"

validations:
  requireAudit: true
  requireUpgradeTests: true
```

### Emergency Procedures

1. **Pause Deployments:**
   - Remove `deploy` label from PRs
   - Disable GitHub Actions workflow temporarily

2. **Rollback:**
   - For UUPS contracts, create rollback proposal
   - Use Safe to execute upgrade back to previous implementation

3. **Security Incident:**
   - Revoke RPC keys immediately
   - Review all pending Safe transactions
   - Audit GitHub Actions logs

## Support and Resources

- **GitHub Issues:** https://github.com/susumutomita/ZeroKeyCI/issues
- **Documentation:** This guide and inline code comments
- **Safe Docs:** https://docs.safe.global
- **OPA Docs:** https://www.openpolicyagent.org/docs/
- **Hardhat Docs:** https://hardhat.org/docs

## License

MIT License - See LICENSE file for details
