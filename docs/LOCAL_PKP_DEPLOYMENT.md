# Local PKP Deployment Guide

## Overview

This guide explains how to deploy smart contracts from your local machine using the ZeroKeyCI workflow.

## Current Status

**WORKING**: Local Safe proposal + PKP auto-signing + Safe submission
**Fallback**: If セッション signatures fail, the script instructs you to submit/sign via the Safe UI so you are never blocked。

## Quick Start

```bash
# 1. Configure deployment
#    Edit .zerokey/deploy.yaml with your contract and network

# 2. Run deployment
bun run deploy

# 3. Review the generated proposal + Safe Tx hash
#    File: safe-proposal-local.json / console output

# 4. Open the Safe UI link from the console (already queued when auto-sign succeeds)
#    Co-sign / execute like any other Safe transaction
```

## What Works Now

The `bun run deploy` script now:

1. ✅ Loads PKP configuration from `.zerokey/pkp-config.json`
2. ✅ Loads deployment config from `.zerokey/deploy.yaml`
3. ✅ Compiles the contract with Hardhat
4. ✅ Creates a Safe deployment proposal
5. ✅ Validates the proposal
6. ✅ Calculates the expected deployment address
7. ✅ Saves the proposal to `safe-proposal-local.json`
8. ✅ Generates Lit セッション signatures, signs with the configured PKP, and queues the transaction in the Safe Transaction Service (returns the Safe Tx hash in the console)
9. 🤝 Falls back to manual Safe submission if Lit セッション signatures are misconfigured so you can still proceed

## Configuration

### PKP Configuration (`.zerokey/pkp-config.json`)

Already configured with:
- PKP Ethereum Address: `0x9CBC31d19108F622b13Ebcaa3906aEc45e1ADD44`
- Lit Network: `datil-test`
- Lit Action IPFS CID: `bafybeigfkfpdz5br6efhbkqwujfqkfndgcfgfebhmnpdiofvfi7ypxl25y`
- Safe Address: `0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663`

### Deployment Configuration (`.zerokey/deploy.yaml`)

```yaml
network: base-sepolia
contract: SimpleStorage
constructorArgs: []
value: "0"
```

You can modify these values to deploy different contracts or to different networks.

## Generated Proposal Format

The script generates a JSON file (`safe-proposal-local.json`) with:

```json
{
  "proposal": {
    "to": "0x0000000000000000000000000000000000000000",
    "value": "0",
    "data": "0x608060...", // Contract bytecode
    "operation": 0  // CREATE operation
  },
  "metadata": {
    "pr": "local",
    "commit": "local",
    "deployer": "local-pkp",
    "network": "base-sepolia",
    "contractName": "SimpleStorage"
  },
  "safeAddress": "0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663",
  "chainId": 84532,
  "validationHash": "0x2e185a...",
  "timestamp": 1761476151106
}
```

## Manual Signing Workflow

After running `bun run deploy`:

1. **Review Proposal**
   - File: `safe-proposal-local.json`
   - Verify contract name, network, Safe address

2. **Submit to Safe**
   - Open the Safe UI link (provided in script output)
   - Example: `https://app.safe.global/transactions/queue?safe=base-sep:0xfbD23fcc0D45a3BD6CdBff38b8C03C2A8E9ec663`
   - Upload or manually create the transaction

3. **Sign Transaction**
   - Safe owners sign via their wallets
   - Threshold: 1 signature required (based on your Safe configuration)

4. **Execute**
   - Once threshold is met, execute the transaction
   - Contract deploys to the calculated address

## How セッション Signatures Work Locally

The script now generates セッション signatures for you automatically。

1. It requests `getPkpSessionSigs` from Lit using your PKP token ID and Lit Action CID。
2. It scopes the セッション to `pkp-signing` and `lit-action-execution`, so the signature can only sign this proposal。
3. It feeds the resulting SessionSigsMap into `LitPKPSigner`, which executes the Lit Action on the distributed Lit nodes。

Nothing to configure—just ensure `.zerokey/pkp-config.json` contains `tokenId`, `publicKey`, and `litActionIpfsCid`.

## When Auto-Signing Falls Back

Auto-signing can still fall back to manual mode if:

- セッション signatures cannot be issued (e.g., Lit Action permission missing)
- Lit nodes are unreachable from your network
- Safe API rejects the proposal (wrong chain ID / Safe address)

If that happens the script logs the failure reason, prints the Safe UI URL, and you can finish the workflow manually while you fix the underlying configuration。

## Alternative: GitHub Actions Workflow

For automated PKP signing, use the GitHub Actions workflow:

1. Push changes to a branch
2. Create a pull request with the `deploy` label
3. Workflow automatically:
   - Compiles contract
   - Creates Safe proposal
   - Signs with PKP (if configured)
   - Submits to Safe Transaction Service

See `docs/ZEROKEYCI_SAMPLE_PKP_SETUP.md` for GitHub Actions configuration.

## Troubleshooting

### Contract Not Found

**Error**: `Contract artifact not found`

**Solution**: Update `.zerokey/deploy.yaml` with a valid contract name from `contracts/`:
- `SimpleStorage` ✅
- `ExampleUUPS` ✅
- `ExampleUUPSV2` ✅

### Wrong Network

**Error**: Network mismatch

**Solution**: Ensure `deploy.yaml` network matches your Safe address network:
- If Safe is on Base Sepolia, use `network: base-sepolia`
- If Safe is on Sepolia, use `network: sepolia`

### PKP Auto-Signing Failed

**Error**: Console shows `PKP auto-signing failed: ...`

**Solution**:
- Confirm `.zerokey/pkp-config.json` includes `tokenId`, `publicKey`, and `litActionIpfsCid`
- Re-run `bun run scripts/setup/grant-lit-action-permission.ts` if the Lit Action CID recently changed
- If Lit nodes are rate-limited, re-run `bun run deploy` after a minute—the script will keep falling back to manual mode in the meantime

### Validation Hash Shows Undefined

This is a display issue only. The actual proposal file (`safe-proposal-local.json`) contains the correct validation hash.

## Security

**No private keys stored locally**
**No private keys in CI/CD**
**Safe multisig approval required**
**PKP private key distributed across Lit nodes (not locally accessible)**

## Next Steps

1. **Quick Deployment**: Run `bun run deploy`, grab the Safe Tx hash from the console, and co-sign / execute inside the Safe UI.
2. **If Auto-Signing Fails**: Follow the "PKP Auto-Signing Failed" troubleshooting steps—the script keeps you unblocked with manual fallback。
3. **CI/CD**: Configure the GitHub Actions workflow + secrets so the same PKP flow runs in PRs.

## References

- Main README: `../README.md`
- PKP Setup: `./PKP_SETUP.md`
- ZeroKeyCI Sample Setup: `./ZEROKEYCI_SAMPLE_PKP_SETUP.md`
- Lit Protocol Docs: https://developer.litprotocol.com/
