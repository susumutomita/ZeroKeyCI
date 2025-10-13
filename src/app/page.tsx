'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            ZeroKeyCI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Deploy Smart Contracts Without Private Keys in CI/CD
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12">
            Secure, keyless deployment system using Gnosis Safe multisig
            proposals. Never store private keys in your CI environment again.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="#getting-started"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
            <a
              href="https://github.com/susumutomita/ZeroKeyCI"
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  1
                </span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Create PR
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Developer creates PR with smart contract changes and adds deploy
                label
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  2
                </span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                CI Generates Proposal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GitHub Actions creates unsigned Safe transaction proposal
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  3
                </span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Review & Sign
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Safe owners review and sign the deployment transaction
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  4
                </span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Deploy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Contract is deployed to blockchain once threshold is met
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                No Private Keys in CI
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Private keys never touch your CI environment. All signing
                happens through Safe multisig.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Policy Validation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                OPA policies ensure deployments meet your security and
                compliance requirements.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Audit Trail
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete audit trail from PR to deployment with all approvals
                tracked on-chain.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                UUPS Upgradeable
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built-in support for UUPS proxy pattern for upgradeable
                contracts.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Deterministic Addresses
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Calculate deployment addresses before deployment using CREATE2.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                100% Test Coverage
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Thoroughly tested with comprehensive test suite ensuring
                reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section
        id="getting-started"
        className="px-6 py-16 bg-white dark:bg-gray-900"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Getting Started
          </h2>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['overview', 'setup', 'deploy', 'test'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-md capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            {activeTab === 'overview' && (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-4">Overview</h3>
                <p className="mb-4">
                  ZeroKeyCI enables secure smart contract deployment without
                  exposing private keys in your CI/CD pipeline. Here&apos;s what
                  you need:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>A GitHub repository with your smart contracts</li>
                  <li>A Gnosis Safe multisig wallet</li>
                  <li>GitHub Actions enabled in your repository</li>
                  <li>Hardhat for contract compilation</li>
                </ul>
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Initial Setup</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      1. Configure GitHub Secrets
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`# In GitHub repository settings:
Settings → Secrets → Actions → New repository secret

SAFE_ADDRESS=0x742D35CC6634c0532925A3b844BC9E7595F0BEb0`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      2. Create Deployment Configuration
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`# .zerokey/deploy.yaml
network: sepolia
contract: YourContract
signers:
  threshold: 2
  addresses:
    - 0xAddress1
    - 0xAddress2
gasLimit: 5000000
metadata:
  description: Deploy YourContract to Sepolia
  requestor: CI/CD Pipeline`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      3. Set Up OPA Policies
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`# .zerokey/policy.rego
package deployment

default allow = false

allow {
  valid_network
  valid_signers
  valid_gas_limit
  no_private_keys
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">
                  Deployment Process
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      1. Create Your Contract
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`// contracts/YourContract.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract YourContract is UUPSUpgradeable {
    // Your contract logic
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      2. Create PR with Deploy Label
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`git checkout -b feat/deploy-contract
git add contracts/
git commit -m "feat: add YourContract"
git push origin feat/deploy-contract

# Create PR on GitHub and add 'deploy' label`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      3. CI Generates Proposal
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      When you merge the PR, GitHub Actions will:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Compile your contracts</li>
                      <li>Generate Safe transaction proposal</li>
                      <li>Upload proposal as artifact</li>
                      <li>Comment on PR with details</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">4. Sign and Execute</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Safe owners review the proposal, sign the transaction, and
                      execute deployment once threshold is met.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Local Testing</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      Run Local Test Script
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`# Test SafeProposalBuilder locally
bun run scripts/test-local-deployment.ts

# Output:
# ✅ Proposal created successfully
# ✅ Validation result: Valid
# 📍 Expected deployment address: 0x7b9244...
# 💾 Proposal saved to: test-safe-proposal.json`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Run Test Suite</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`# Run all tests with coverage
bun run test:coverage

# Run validation checks
make before_commit`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Verify Proposal</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                      <code>{`# Check generated proposal
cat test-safe-proposal.json | jq .

# Validate with OPA
bun run scripts/validate-deployment.ts`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            System Architecture
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│  Developer   │────▶│   GitHub     │────▶│   CI/CD      │
│              │     │     PR       │     │  (Actions)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │              │
                                          │ SafeProposal │
                                          │   Builder    │
                                          └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │              │
                                          │     OPA      │
                                          │  Validation  │
                                          └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │              │
                                          │   Proposal   │
                                          │   Artifact   │
                                          └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│ Safe Owners  │────▶│ Gnosis Safe  │────▶│  Blockchain  │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
              `}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-100 dark:bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Built with security and simplicity in mind
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="https://github.com/susumutomita/ZeroKeyCI"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Documentation
            </a>
            <a
              href="https://github.com/susumutomita/ZeroKeyCI/issues"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Issues
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
