# How ZeroKeyCI Works: No Private Keys Needed

## The Key Insight

**Q: CIに秘密鍵をセットしなくても本当にデプロイできるの？**

**A: Yes! The trick is: CI doesn't actually deploy. It only creates proposals.**

## Traditional vs ZeroKeyCI

### ❌ Traditional Approach (Private Key Required)

```typescript
// Traditional deployment script
const privateKey = process.env.DEPLOYER_PRIVATE_KEY; // ⚠️ Dangerous!
const wallet = new ethers.Wallet(privateKey, provider);

// Directly sign and broadcast transaction
const tx = await wallet.sendTransaction({
  to: factoryAddress,
  data: deploymentBytecode,
});

await tx.wait(); // Contract deployed!
```

**Problems:**
1. Private key must be in CI environment
2. Single point of failure
3. Anyone with CI access can deploy
4. No multi-party approval
5. Leaked key = compromised system

### ✅ ZeroKeyCI Approach (No Private Key!)

```typescript
// ZeroKeyCI: Create proposal WITHOUT signing
import { SafeProposalBuilder } from './SafeProposalBuilder';

// No private key needed!
const builder = new SafeProposalBuilder({
  safeAddress: process.env.SAFE_ADDRESS, // Public address
  chainId: 11155111,
  // Notice: NO privateKey parameter!
});

// Create UNSIGNED proposal
const proposal = await builder.createDeploymentProposal({
  contractName: "MyContract",
  bytecode: compiledBytecode,
  constructorArgs: [],
  metadata: {
    pr: "#123",
    commit: "abc123",
  },
});

// Save proposal as artifact (unsigned!)
fs.writeFileSync('proposal.json', JSON.stringify(proposal));
// Upload to GitHub Artifacts
```

**How it works:**
1. CI creates transaction data (bytecode, arguments, metadata)
2. CI does NOT sign the transaction
3. Safe owners sign later with their personal keys
4. Transaction executes only after threshold signatures

## Step-by-Step: How Deployment Works

### Step 1: Developer Creates PR

```bash
# Developer writes contract locally
git checkout -b feat/new-contract
vim contracts/MyContract.sol

# Comprehensive tests
bun run test:coverage # 100% coverage

# Create PR
git push origin feat/new-contract
# Open PR on GitHub
```

**No secrets involved yet.**

### Step 2: CI Runs Tests

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: bun run test

      - name: Coverage
        run: bun run test:coverage
```

**Still no secrets needed.**

### Step 3: PR Merged with 'deploy' Label

```yaml
# .github/workflows/deploy.yml
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  create-proposal:
    if: github.event.pull_request.merged && contains(labels, 'deploy')
```

**Deployment workflow triggers.**

### Step 4: CI Compiles Contract

```yaml
- name: Compile contracts
  run: npx hardhat compile
```

**No secrets, just compilation.**

### Step 5: CI Creates Unsigned Proposal

```typescript
// In GitHub Actions
const { SafeProposalBuilder } = require('./SafeProposalBuilder');

// Read Safe address from environment (public info)
const safeAddress = process.env.SAFE_ADDRESS; // "0x1234..."

// Create proposal builder
const builder = new SafeProposalBuilder({
  safeAddress,
  chainId: 11155111,
});

// Build deployment transaction data
const proposal = await builder.createDeploymentProposal({
  contractName: "MyContract",
  bytecode: artifact.bytecode,
  constructorArgs: [],
  value: '0',
  metadata: {
    pr: context.issue.number,
    commit: context.sha,
  },
});

// Serialize proposal
const json = builder.serializeProposal(proposal);
fs.writeFileSync('safe-proposal.json', json);
```

**Key point: This creates the transaction data but does NOT sign it!**

### Step 6: Proposal Uploaded as Artifact

```yaml
- name: Upload proposal
  uses: actions/upload-artifact@v4
  with:
    name: safe-proposal-${{ github.sha }}
    path: safe-proposal.json
```

**Artifact contains:**
```json
{
  "safe": "0x1234...",
  "to": "0x0000...", // Create2 factory or zero address for deployment
  "value": "0",
  "data": "0x608060405234801561001057600080fd5b50...", // Contract bytecode
  "operation": 0,
  "safeTxGas": 0,
  "baseGas": 0,
  "gasPrice": "0",
  "gasToken": "0x0000000000000000000000000000000000000000",
  "refundReceiver": "0x0000000000000000000000000000000000000000",
  "nonce": 5,
  "metadata": {
    "pr": "123",
    "commit": "abc123def456"
  }
}
```

**This is just data. It cannot execute without signatures!**

### Step 7: Safe Owners Review Proposal

**Owner downloads artifact:**
```bash
# From GitHub Actions page
wget https://github.com/.../artifacts/safe-proposal.json
```

**Owner reviews the proposal:**
```bash
# View proposal details
cat safe-proposal.json | jq

# Check:
# - Contract bytecode matches expected
# - Constructor args correct
# - Metadata links to correct PR
# - Safe address is correct
```

### Step 8: Safe Owners Sign with Their Keys

**Using Safe Web UI:**

1. Go to https://app.safe.global
2. Connect wallet (MetaMask, Ledger, Trezor)
3. Import transaction from proposal JSON
4. Review transaction details (Safe UI decodes it)
5. Sign with personal key (on hardware wallet if using Ledger)

**Or using Safe CLI:**
```bash
# Owner 1 signs
safe-cli --safe 0x1234... sign-transaction \
  --data $(cat safe-proposal.json | jq -r .data)

# Owner 2 signs
safe-cli --safe 0x1234... sign-transaction \
  --data $(cat safe-proposal.json | jq -r .data)

# When threshold reached (e.g., 2-of-3), execute
safe-cli --safe 0x1234... execute-transaction
```

**Keys location:**
- Owner 1: Ledger hardware wallet
- Owner 2: Trezor hardware wallet
- Owner 3: Safe mobile app

**NONE of these keys are in CI!**

### Step 9: Transaction Executes

When threshold signatures collected (e.g., 2 out of 3 owners signed):

```
Safe Multisig Contract
    ↓
Validates signatures
    ↓
Executes transaction
    ↓
Deploys contract bytecode
    ↓
Contract deployed at deterministic address!
```

## The Magic: How Does Safe Work?

### Gnosis Safe Smart Contract

Safe is itself a smart contract that can:

1. **Hold assets** (ETH, tokens, NFTs)
2. **Execute transactions** on behalf of owners
3. **Require threshold signatures** before execution

**Safe Contract Code (simplified):**
```solidity
contract GnosisSafe {
    mapping(address => bool) public owners;
    uint256 public threshold;

    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        bytes memory signatures // Multiple signatures!
    ) external {
        // Validate signatures
        require(
            checkSignatures(keccak256(data), signatures) >= threshold,
            "Insufficient signatures"
        );

        // Execute transaction
        (bool success, ) = to.call{value: value}(data);
        require(success, "Transaction failed");
    }

    function checkSignatures(
        bytes32 dataHash,
        bytes memory signatures
    ) internal view returns (uint256 validSignatures) {
        // Verify each signature is from an owner
        // Count valid signatures
        // Return count
    }
}
```

### How Deployment Works Through Safe

1. **CI creates transaction data:**
   ```
   to: 0x0000000000000000000000000000000000000000 (deploy)
   value: 0
   data: 0x608060405... (contract bytecode)
   ```

2. **Owners sign the data hash:**
   ```
   dataHash = keccak256(to, value, data, nonce, ...)
   signature1 = sign(dataHash, owner1PrivateKey) // On Ledger
   signature2 = sign(dataHash, owner2PrivateKey) // On Trezor
   ```

3. **Anyone can submit to Safe contract:**
   ```solidity
   safe.execTransaction(
       to,
       value,
       data,
       signatures // Contains signature1 + signature2
   )
   ```

4. **Safe validates and executes:**
   - Checks signatures are from valid owners
   - Checks threshold met (2 out of 3)
   - Executes the deployment transaction
   - Contract deployed!

**Key insight:** The Safe contract itself executes the deployment. CI just prepared the data!

## Does This Work for All Operations?

### ✅ Works for:

1. **Contract Deployment:**
   ```typescript
   const proposal = await builder.createDeploymentProposal({
     contractName: "MyContract",
     bytecode: compiledBytecode,
     constructorArgs: [arg1, arg2],
   });
   ```

2. **Contract Upgrades:**
   ```typescript
   const proposal = await builder.createUpgradeProposal({
     proxyAddress: "0xProxy...",
     newImplementation: "0xNewImpl...",
   });
   ```

3. **Function Calls:**
   ```typescript
   const proposal = await builder.createFunctionCallProposal({
     contractAddress: "0xContract...",
     functionSignature: "transfer(address,uint256)",
     args: [recipient, amount],
   });
   ```

4. **Batch Transactions:**
   ```typescript
   const proposal = await builder.createBatchProposal([
     { to: addr1, data: data1 },
     { to: addr2, data: data2 },
   ]);
   ```

### ❌ Limitations:

1. **Requires Safe Setup:**
   - Must have Gnosis Safe deployed
   - Must have owners with keys
   - Must configure threshold

2. **Not Instant:**
   - Requires manual signing
   - Depends on owner availability
   - Not suitable for real-time operations

3. **Gas Costs:**
   - Safe execution has overhead
   - Signature verification costs gas
   - ~50k extra gas per transaction

## Account Abstraction (AA) vs ZeroKeyCI

### Account Abstraction (ERC-4337)

AA is a different approach that also improves key management:

```typescript
// Account Abstraction UserOperation
const userOp = {
  sender: smartAccountAddress,
  nonce: 0,
  initCode: "0x...",
  callData: "0x...",
  // ... other fields
};

// Bundler submits to EntryPoint contract
await bundler.sendUserOperation(userOp);
```

**Benefits:**
- Social recovery
- Gasless transactions (paymaster)
- Custom validation logic
- Better UX

**ZeroKeyCI could use AA:**
- Create UserOps in CI instead of Safe transactions
- Owners sign UserOps instead of Safe transactions
- Submit to AA bundler instead of Safe

**But not required:** Safe multisig is simpler and battle-tested.

### Why Not Use AA Now?

1. **Maturity:** Safe has 5+ years of production use
2. **Tooling:** Safe has excellent UI and infrastructure
3. **Compatibility:** Safe works on all EVM chains
4. **Audits:** Safe is extensively audited

**Future:** Could add AA support as alternative to Safe.

## Frequently Asked Questions

### Q: CIが署名しないのに、どうやってnonceを知るの？

**A:** Safe transaction includes nonce, but nonce is just data. Safe owners verify the nonce is correct before signing. If nonce is wrong, transaction will fail validation, and owners won't sign.

### Q: 誰かがproposalを改ざんしたら？

**A:** Owners review the actual transaction data in Safe UI before signing. Safe UI decodes the bytecode and shows what it will do. Malicious changes are visible.

### Q: 緊急時に即座にdeployできないのでは？

**A:** Correct. Multi-sig inherently adds delay. For emergencies:
- Use lower threshold (1-of-2) on testnet
- Have backup owners ready
- Use Lit Protocol Vincent for automated signing with policy constraints (planned feature)

### Q: Safeのowner鍵が漏れたら？

**A:** Remove compromised owner from Safe, add new owner. Other owners still safe. Much better than single private key in CI where leak = total compromise.

### Q: プロダクションで本当に使われているの？

**A:** Yes! Many projects use Safe multisig for deployments:
- Uniswap governance
- Aave governance
- Compound governance
- MakerDAO governance

ZeroKeyCI is just automation around this proven pattern.

## Summary

**秘密鍵をCIにセットしなくて良い理由:**

1. CI doesn't deploy directly - it creates proposals
2. Proposals are just unsigned transaction data
3. Safe owners sign with their personal keys
4. Safe smart contract validates signatures and executes
5. No keys in CI = no keys to leak!

**The core innovation:** Separate transaction creation (CI) from transaction signing (owners).

This is similar to how banks work:
- Clerk prepares wire transfer (CI)
- Manager must approve and sign (Safe owners)
- Bank executes after approval (Safe contract)

No one expects the clerk to have the manager's signature!

## Resources

- **Gnosis Safe:** https://safe.global
- **Safe Contracts:** https://github.com/safe-global/safe-contracts
- **ERC-4337:** https://eips.ethereum.org/EIPS/eip-4337
- **Multi-sig Best Practices:** https://ethereum.org/en/developers/docs/smart-contracts/security/

## License

MIT License
