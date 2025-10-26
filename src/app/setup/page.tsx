'use client';

import { CodeSnippet } from '@/components/CodeSnippet';
import Link from 'next/link';
import {
  Rocket,
  ExternalLink,
  BookOpen,
  Shield,
  HelpCircle,
} from 'lucide-react';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-radial from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-strong border border-blue-300/30 dark:border-blue-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
              <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-300 font-medium">
                Setup Guide
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight">
              Setup Your CI/CD Deployment
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Deploy smart contracts from GitHub Actions with zero private keys.
            </p>

            {/* Prerequisites Warning */}
            <div className="max-w-2xl mx-auto p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                    ⚠️ Before You Start
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                    You need these prerequisites (15-20 minutes first-time
                    setup):
                  </p>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-mono">1.</span>
                      <span>
                        <strong>Safe Wallet</strong> - Create at{' '}
                        <a
                          href="https://app.safe.global"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-600 dark:hover:text-yellow-200"
                        >
                          app.safe.global
                        </a>{' '}
                        (5-10 minutes)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono">2.</span>
                      <span>
                        <strong>RPC URL</strong> - Get from{' '}
                        <a
                          href="https://www.alchemy.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-600 dark:hover:text-yellow-200"
                        >
                          Alchemy
                        </a>
                        ,{' '}
                        <a
                          href="https://www.infura.io/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-600 dark:hover:text-yellow-200"
                        >
                          Infura
                        </a>
                        , or use{' '}
                        <a
                          href="https://chainlist.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-600 dark:hover:text-yellow-200"
                        >
                          public RPC
                        </a>{' '}
                        (5-10 minutes)
                      </span>
                    </li>
                  </ul>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-3">
                    💡 <strong>Already have these?</strong> Setup takes 3
                    minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Create Workflow */}
          <div className="glass-card p-8 border border-white/10 dark:border-white/5 mb-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Create GitHub Workflow
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add this file to{' '}
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    .github/workflows/deploy.yml
                  </code>{' '}
                  in your repository:
                </p>
                <CodeSnippet
                  language="yaml"
                  title=".github/workflows/deploy.yml"
                  code={`name: Deploy with ZeroKeyCI

on:
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch:

permissions:
  actions: write
  pull-requests: write
  contents: read

jobs:
  deploy:
    if: github.event_name == 'workflow_dispatch' || github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: susumutomita/ZeroKeyCI@main
        with:
          safe-address: \${{ vars.SAFE_ADDRESS }}
          network: base-sepolia
          contract-name: MyContract
          verify-blockscout: true
          rpc-url: \${{ secrets.RPC_URL }}`}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Configure Secrets */}
          <div className="glass-card p-8 border border-white/10 dark:border-white/5 mb-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Configure GitHub Secrets
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Run these commands in your repository to set up required
                  secrets:
                </p>
                <CodeSnippet
                  language="bash"
                  title="Terminal"
                  code={`gh variable set SAFE_ADDRESS --body "0xYourSafeAddress"
gh secret set RPC_URL --body "https://base-sepolia.g.alchemy.com/v2/YOUR_KEY"`}
                />
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                        Where to get these values:
                      </p>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>
                          <strong>SAFE_ADDRESS</strong>: Your Safe multisig
                          wallet address (
                          <a
                            href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/SAFE_SETUP.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600 dark:hover:text-blue-200"
                          >
                            create one here
                          </a>
                          )
                        </li>
                        <li>
                          <strong>RPC_URL</strong>: Your blockchain RPC endpoint
                          (get from{' '}
                          <a
                            href="https://www.alchemy.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600 dark:hover:text-blue-200"
                          >
                            Alchemy
                          </a>
                          ,{' '}
                          <a
                            href="https://www.infura.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600 dark:hover:text-blue-200"
                          >
                            Infura
                          </a>
                          , or{' '}
                          <a
                            href="https://chainlist.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600 dark:hover:text-blue-200"
                          >
                            public RPC
                          </a>
                          )
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Trigger Deployment */}
          <div className="glass-card p-8 border border-white/10 dark:border-white/5 mb-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Trigger Deployment
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unlike Hardhat&apos;s{' '}
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    npx hardhat deploy
                  </code>
                  , ZeroKeyCI triggers automatically when you merge a PR:
                </p>
                <CodeSnippet
                  language="bash"
                  title="How to Deploy Your Contract"
                  code={`# 1. Create a branch with your contract changes
git checkout -b feat/deploy-my-contract

# 2. Add your smart contract
git add contracts/MyContract.sol
git commit -m "feat: add MyContract for deployment"

# 3. Push and create PR
git push origin feat/deploy-my-contract
gh pr create --title "Deploy MyContract to Base Sepolia"

# 4. Merge PR - THIS TRIGGERS THE DEPLOYMENT
gh pr merge

# GitHub Actions will automatically:
# - Compile your contract
# - Create Safe transaction proposal
# - Post PR comment with Safe UI link`}
                />
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                        What Happens After Merge:
                      </p>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>✅ GitHub Actions compiles your contract</li>
                        <li>✅ Creates Safe transaction proposal</li>
                        <li>✅ Posts PR comment with Safe UI link</li>
                        <li>✅ You sign in Safe UI → Contract deploys</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-300/30 dark:border-green-500/30 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    ✨ No manual deploy command needed! PR merge is the trigger.
                    Your Safe owners sign proposals in the Safe UI.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Optional: PKP Automation */}
          <div className="glass-card p-8 border border-purple-300/30 dark:border-purple-500/30 mb-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Optional: Enable PKP Automation
                  </h2>
                  <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    Advanced • 15-20 min
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Skip manual signing and enable fully automated deployments
                  using Lit Protocol PKPs (Programmable Key Pairs).
                </p>

                {/* What is PKP */}
                <div className="mb-6 p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-300/30 dark:border-purple-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What is PKP Automation?
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    A PKP (Programmable Key Pair) is a distributed cryptographic
                    key controlled by Lit Protocol&apos;s decentralized network.
                    The private key is split across multiple nodes - no single
                    party can access it.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                        ✅ Use PKP if you want:
                      </p>
                      <ul className="text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                        <li>• Fully automated deployments</li>
                        <li>• Deploy multiple times per day</li>
                        <li>• Conditional signing (tests, OPA)</li>
                        <li>• No manual Safe UI interaction</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                        ℹ️ Stick with Manual if you:
                      </p>
                      <ul className="text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                        <li>• Deploy infrequently (weekly/monthly)</li>
                        <li>• Want maximum control</li>
                        <li>• Prefer human approval</li>
                        <li>• Are just getting started</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* GitHub Secrets for PKP */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Additional GitHub Secrets for PKP
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  After completing PKP setup, add these secrets to your
                  repository:
                </p>

                <CodeSnippet
                  language="bash"
                  title="Terminal - Add PKP Secrets"
                  code={`gh secret set PKP_PUBLIC_KEY --body "0xYourPKPAddress"
gh secret set LIT_ACTION_IPFS_CID --body "QmYour...IPFSHash"
gh variable set LIT_NETWORK --body "datil-dev"`}
                />

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">
                          Secret Name
                        </th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">
                          What It Is
                        </th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">
                          How to Get It
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-3 font-mono text-xs bg-gray-50 dark:bg-gray-800/50">
                          PKP_PUBLIC_KEY
                        </td>
                        <td className="py-3 px-3">
                          Your PKP&apos;s Ethereum address
                        </td>
                        <td className="py-3 px-3">
                          Run{' '}
                          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            bun run scripts/setup/mint-pkp.ts
                          </code>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-3 font-mono text-xs bg-gray-50 dark:bg-gray-800/50">
                          LIT_ACTION_IPFS_CID
                        </td>
                        <td className="py-3 px-3">
                          IPFS hash of your signing logic
                        </td>
                        <td className="py-3 px-3">
                          See{' '}
                          <a
                            href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/LIT_ACTION_SETUP.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            LIT_ACTION_SETUP.md
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-mono text-xs bg-gray-50 dark:bg-gray-800/50">
                          LIT_NETWORK
                        </td>
                        <td className="py-3 px-3">Lit Protocol network name</td>
                        <td className="py-3 px-3">
                          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            datil-dev
                          </code>{' '}
                          (testnet) or{' '}
                          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            datil
                          </code>{' '}
                          (mainnet)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PKP Setup Scripts */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Step-by-Step: Run PKP Setup Scripts
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Run these 4 scripts in order to set up PKP automation (15-20
                  minutes total):
                </p>

                <div className="space-y-4 mb-6">
                  {/* Script 1: Mint PKP */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Mint PKP NFT
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Creates a distributed cryptographic key pair
                          controlled by Lit Protocol. This generates your PKP
                          address and token ID.
                        </p>
                        <CodeSnippet
                          language="bash"
                          code={`LIT_NETWORK=datil-test ETHEREUM_PRIVATE_KEY=0x... \\
bun run scripts/setup/mint-pkp.ts

# Outputs: .zerokey/pkp-config.json with PKP address`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Script 2: Upload Lit Action */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Upload Lit Action to IPFS
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Uploads your signing logic (conditionalSigner.js) to
                          IPFS. Returns the IPFS CID needed for permission
                          granting.
                        </p>
                        <CodeSnippet
                          language="bash"
                          code={`LIT_NETWORK=datil-test bun run scripts/setup/upload-lit-action.ts

# Prompts for IPFS upload (Web3.Storage/Pinata)
# Saves CID to pkp-config.json`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Script 3: Grant Permissions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Grant Lit Action Permission
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Authorizes your Lit Action to sign transactions using
                          the PKP. Required before the PKP can participate in
                          automated signing.
                        </p>
                        <CodeSnippet
                          language="bash"
                          code={`ETHEREUM_PRIVATE_KEY=0x... \\
bun run scripts/setup/grant-lit-action-permission.ts

# Grants SignAnything permission to Lit Action`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Script 4: Add PKP to Safe */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        4
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Add PKP as Safe Owner
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Adds your PKP as an owner of your Safe multisig
                          wallet. After this, PKP can participate in automated
                          transaction signing.
                        </p>
                        <CodeSnippet
                          language="bash"
                          code={`BASE_SEPOLIA_RPC_URL=https://sepolia.base.org \\
SAFE_ADDRESS=0xYourSafeAddress \\
ETHEREUM_PRIVATE_KEY=0x... \\
SAFE_THRESHOLD=1 \\
bun run scripts/setup/add-pkp-to-safe.ts

# Proposes "add owner" transaction
# Safe owners approve → PKP becomes owner`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-300/30 dark:border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ <strong>After completing these 4 scripts</strong>, your
                    PKP is ready for automated signing! The final
                    pkp-config.json contains all values you need for GitHub
                    Secrets.
                  </p>
                </div>

                {/* Update Workflow */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Update Your Workflow
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enable PKP signing in your{' '}
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    .github/workflows/deploy.yml
                  </code>
                  :
                </p>

                <CodeSnippet
                  language="yaml"
                  title=".github/workflows/deploy.yml (with PKP)"
                  code={`      - uses: susumutomita/ZeroKeyCI@main
        with:
          safe-address: \${{ vars.SAFE_ADDRESS }}
          network: base-sepolia
          contract-name: MyContract
          verify-blockscout: true
          rpc-url: \${{ secrets.RPC_URL }}
          # PKP Automation (add these lines)
          pkp-enabled: true
          pkp-public-key: \${{ secrets.PKP_PUBLIC_KEY }}
          lit-action-ipfs-cid: \${{ secrets.LIT_ACTION_IPFS_CID }}
          lit-network: \${{ vars.LIT_NETWORK }}`}
                />

                {/* Complete Setup Guide */}
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                        📖 Full PKP Setup Guide Required
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                        PKP setup requires multiple steps (mint NFT, grant
                        permissions, add to Safe). Follow the complete guide:
                      </p>
                      <a
                        href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/PKP_SETUP.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
                      >
                        <span>Complete PKP Setup Guide →</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Need More Help? */}
          <div className="mt-12 glass-card border border-blue-300/30 dark:border-blue-500/30 rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Need More Help?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Check out our comprehensive documentation and guides.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/INTEGRATION_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 glass-card border border-white/10 hover:border-blue-300/30 dark:hover:border-blue-500/30 rounded-lg transition-all group"
              >
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Integration Guide
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete setup walkthrough
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/SAFE_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 glass-card border border-white/10 hover:border-blue-300/30 dark:hover:border-blue-500/30 rounded-lg transition-all group"
              >
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Safe Setup Guide
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create your Safe multisig
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/PKP_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 glass-card border border-white/10 hover:border-purple-300/30 dark:hover:border-purple-500/30 rounded-lg transition-all group"
              >
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    PKP Setup Guide
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Setup automated signing
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/DEMO_MODE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 glass-card border border-white/10 hover:border-blue-300/30 dark:hover:border-blue-500/30 rounded-lg transition-all group"
              >
                <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Demo Mode
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Try without creating Safe
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 glass-card border border-white/10 hover:border-blue-300/30 dark:hover:border-blue-500/30 rounded-lg transition-all group"
              >
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Ask Questions
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    GitHub Issues
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built for ETHOnline 2025
            </p>
            <Link
              href="/"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
