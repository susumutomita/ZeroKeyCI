# Upgradeable Contract Deployment Guide

This guide explains how to deploy and upgrade smart contracts using proxy patterns with ZeroKeyCI. All deployments are performed through Safe multisig proposals without requiring any private keys in your CI/CD pipeline.

## Table of Contents

- [Overview](#overview)
- [Supported Proxy Patterns](#supported-proxy-patterns)
- [UUPS Proxy Deployment](#uups-proxy-deployment)
- [Transparent Proxy Deployment](#transparent-proxy-deployment)
- [Upgrading Contracts](#upgrading-contracts)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

ZeroKeyCI supports deploying upgradeable smart contracts using two popular proxy patterns:

1. **UUPS (Universal Upgradeable Proxy Standard)** - Upgrade logic in the implementation
2. **Transparent Proxy** - Upgrade logic in the proxy contract

Both patterns allow you to upgrade your contract logic while preserving the contract's address and state.

### How It Works

When deploying an upgradeable contract, ZeroKeyCI creates a batch Safe proposal containing two transactions:

1. **Deploy Implementation** - Your contract logic (deterministic address via CREATE2)
2. **Deploy Proxy** - Proxy contract pointing to the implementation

The proxy address becomes your contract's permanent address, and you can upgrade the implementation later.

## Supported Proxy Patterns

### UUPS (Recommended)

**Advantages:**
- Lower deployment costs (simpler proxy)
- Upgrade logic controlled by implementation
- More flexible upgrade patterns

**Use when:**
- You want gas-efficient deployments
- You need flexible upgrade authorization
- You're building new contracts

### Transparent Proxy

**Advantages:**
- Upgrade logic separated from implementation
- Admin-based upgrade control
- Battle-tested pattern

**Use when:**
- You need strict separation of concerns
- You want admin-controlled upgrades
- You're migrating existing contracts

## UUPS Proxy Deployment

### Step 1: Prepare Your Contract

Your contract must inherit from `UUPSUpgradeable`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyContract is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        // Your initialization logic
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
```

### Step 2: Add Proxy Import Contracts

Create import wrappers so Hardhat compiles the proxy contracts:

```solidity
// contracts/proxies/ERC1967Proxy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
```

### Step 3: Configure Deployment

Create `.zerokey/deploy.yaml`:

```yaml
network: sepolia
contract: MyContract

# Proxy configuration
proxy:
  type: uups
  initializeArgs:
    - "0xYourSafeAddress"  # initialOwner

constructorArgs: []
value: "0"
```

### Step 4: Deploy via CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Generate Safe Proposal
  env:
    SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
  run: |
    bun run scripts/create-safe-proposal.ts
```

### Step 5: Execute Proposal

1. Download `safe-proposal.json` from GitHub Actions artifacts
2. Import into Safe web interface
3. Safe owners sign and execute the batch proposal
4. Both implementation and proxy deploy atomically

## Transparent Proxy Deployment

### Step 1: Prepare Your Contract

Your contract needs an `initialize` function:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContract is Initializable, OwnableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        // Your initialization logic
    }
}
```

### Step 2: Add Proxy Import

```solidity
// contracts/proxies/TransparentUpgradeableProxy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
```

### Step 3: Configure Deployment

```yaml
network: sepolia
contract: MyContract

proxy:
  type: transparent
  admin: "0xAdminAddress"  # Optional, defaults to Safe address
  initializeArgs:
    - "0xYourSafeAddress"

constructorArgs: []
value: "0"
```

### Step 4: Deploy

Same process as UUPS - the script generates the appropriate batch proposal.

## Upgrading Contracts

### UUPS Upgrade

When you need to upgrade your contract:

#### Step 1: Create New Implementation

```solidity
contract MyContractV2 is MyContract {
    // New storage variables go at the end
    uint256 public newFeature;

    function version() public pure override returns (string memory) {
        return "2.0.0";
    }

    // New functions
    function setNewFeature(uint256 _value) public onlyOwner {
        newFeature = _value;
    }
}
```

#### Step 2: Configure Upgrade

```yaml
network: sepolia
contract: MyContractV2

proxy:
  type: uups
  proxyAddress: "0xYourExistingProxyAddress"
  # Optional: initialization call for new version
  # initializeArgs:
  #   - "arg1"

constructorArgs: []
value: "0"
```

#### Step 3: Generate Upgrade Proposal

```bash
SAFE_ADDRESS="0xYourSafe" bun run scripts/create-safe-proposal.ts
```

This creates a batch proposal:
1. Deploy new implementation (V2)
2. Call `upgradeTo(newImplementation)` on the proxy

#### Step 4: Execute via Safe

Safe owners review, sign, and execute the upgrade atomically.

### Transparent Proxy Upgrade

**Note:** Transparent proxy upgrades are not yet fully supported. UUPS is recommended for now.

## Best Practices

### Storage Layout

**Critical:** Never change the order or types of existing storage variables.

**Wrong:**
```solidity
// V1
uint256 public value;
address public owner;

// V2 - BREAKS STORAGE
address public owner;  // Moved up
uint256 public value;
uint256 public newValue;  // Added
```

**Correct:**
```solidity
// V1
uint256 public value;
address public owner;

// V2 - Safe
uint256 public value;
address public owner;
uint256 public newValue;  // Added at end
```

### Initialize Function

- Always use `initializer` modifier
- Call parent initializers (`__Ownable_init`, etc.)
- Disable initializers in constructor

### Constructor

Always disable initializers to prevent implementation initialization:

```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}
```

### Upgrade Authorization

For UUPS, always protect `_authorizeUpgrade`:

```solidity
function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner  // Or your access control
{}
```

### Testing Upgrades

Before deploying:

1. Test locally with Hardhat upgrades plugin
2. Deploy to testnet first
3. Verify storage layout compatibility
4. Test upgrade on testnet
5. Only then deploy to mainnet

### Version Tracking

Add a version function to track deployed versions:

```solidity
function version() public pure virtual returns (string memory) {
    return "1.0.0";
}
```

## Troubleshooting

### "Proxy artifact not found"

**Cause:** Proxy import contracts not compiled.

**Solution:**
1. Create `contracts/proxies/ERC1967Proxy.sol` (for UUPS)
2. Create `contracts/proxies/TransparentUpgradeableProxy.sol` (for Transparent)
3. Run `npx hardhat compile`

### "Invalid proxy address"

**Cause:** Proxy address in upgrade config is not checksummed.

**Solution:** Use checksummed address format:
```yaml
proxyAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3"  # Correct case
```

### "Initialize function not found"

**Cause:** Contract missing `initialize()` function or wrong signature.

**Solution:** Ensure your contract has:
```solidity
function initialize(address param1, ...) public initializer {
    // Initialization logic
}
```

### "Storage collision detected"

**Cause:** Storage layout changed between versions.

**Solution:**
1. Never reorder existing storage variables
2. Only add new variables at the end
3. Use OpenZeppelin's storage gaps for libraries

### Batch Proposal Fails

**Cause:** Safe doesn't have permissions or insufficient gas.

**Solution:**
1. Verify Safe is the owner of the proxy
2. Check gas limit settings
3. For UUPS, ensure Safe can call `upgradeTo()`

## Multi-Chain Deployment

Deploy the same upgradeable contract to multiple networks:

```yaml
# .zerokey/deploy-multi.yaml
deployments:
  - network: sepolia
    safeAddress: "0xSepoliaSafe"
    contract: MyContract
    proxy:
      type: uups
      initializeArgs:
        - "0xSepoliaSafe"
    constructorArgs: []
    value: "0"

  - network: polygon-amoy
    safeAddress: "0xPolygonSafe"
    contract: MyContract
    proxy:
      type: uups
      initializeArgs:
        - "0xPolygonSafe"
    constructorArgs: []
    value: "0"
```

Run:
```bash
bun run scripts/create-multi-safe-proposals.ts .zerokey/deploy-multi.yaml
```

## Security Considerations

1. **Test First:** Always test upgrades on testnet before mainnet
2. **Storage Safety:** Use OpenZeppelin Upgrades plugin to validate storage
3. **Access Control:** Protect upgrade functions with proper access control
4. **Initialization:** Always use `initializer` modifier to prevent re-initialization
5. **Timelock:** Consider adding a timelock for upgrade proposals
6. **Multisig:** Use Safe multisig with multiple owners for upgrade authority

## Resources

- [OpenZeppelin Upgrades Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS vs Transparent Proxies](https://docs.openzeppelin.com/contracts/5.x/api/proxy)
- [Writing Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)
- [Safe Multisig Documentation](https://docs.safe.global/)

## Examples

Complete examples are available in `.zerokey/examples/`:
- `deploy-uups.yaml` - UUPS proxy deployment
- `deploy-transparent.yaml` - Transparent proxy deployment
- `upgrade-uups.yaml` - UUPS proxy upgrade

## Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review example configurations in `.zerokey/examples/`
3. Open an issue on [GitHub](https://github.com/susumutomita/ZeroKeyCI/issues)
