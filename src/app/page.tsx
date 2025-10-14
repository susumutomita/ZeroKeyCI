'use client';

import { useState } from 'react';
import SafeProposalSandbox from '@/components/SafeProposalSandbox';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-900/90 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '-3s' }}
      />

      {/* Hero Section */}
      <section className="relative px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl p-12 animate-fade-in-up backdrop-blur-2xl">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-6 animate-fade-in">
              ZeroKeyCI
            </h1>
            <p className="text-2xl text-gray-800 dark:text-gray-100 mb-4 font-semibold">
              Deploy Smart Contracts Without Private Keys in CI/CD
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
              Secure, keyless deployment system using Gnosis Safe multisig
              proposals. Never store private keys in your CI environment again.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="#getting-started"
                className="glass-button glow-on-hover bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-500 hover:to-purple-500"
              >
                Get Started
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="glass-button text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                num: 1,
                title: 'Create PR',
                desc: 'Developer creates PR with smart contract changes and adds deploy label',
              },
              {
                num: 2,
                title: 'CI Generates Proposal',
                desc: 'GitHub Actions creates unsigned Safe transaction proposal',
              },
              {
                num: 3,
                title: 'Review & Sign',
                desc: 'Safe owners review and sign the deployment transaction',
              },
              {
                num: 4,
                title: 'Deploy',
                desc: 'Contract is deployed to blockchain once threshold is met',
              },
            ].map((step, idx) => (
              <div
                key={step.num}
                className="glass-card p-6 text-center group animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-16 h-16 glass-strong rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white text-lg">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'No Private Keys in CI',
                desc: 'Private keys never touch your CI environment. All signing happens through Safe multisig.',
                icon: '🔐',
              },
              {
                title: 'Policy Validation',
                desc: 'OPA policies ensure deployments meet your security and compliance requirements.',
                icon: '✓',
              },
              {
                title: 'Audit Trail',
                desc: 'Complete audit trail from PR to deployment with all approvals tracked on-chain.',
                icon: '📋',
              },
              {
                title: 'UUPS Upgradeable',
                desc: 'Built-in support for UUPS proxy pattern for upgradeable contracts.',
                icon: '🔄',
              },
              {
                title: 'Deterministic Addresses',
                desc: 'Calculate deployment addresses before deployment using CREATE2.',
                icon: '🎯',
              },
              {
                title: '100% Test Coverage',
                desc: 'Thoroughly tested with comprehensive test suite ensuring reliability.',
                icon: '✅',
              },
            ].map((feature, idx) => (
              <div
                key={feature.title}
                className="glass-card p-8 group animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="relative px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Getting Started
          </h2>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-strong rounded-2xl p-2 inline-flex gap-2">
              {['overview', 'setup', 'deploy', 'test'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl capitalize font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'glass-strong text-gray-900 dark:text-white shadow-lg scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:scale-105'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="glass-strong rounded-3xl p-8 animate-fade-in">
            {activeTab === 'overview' && (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Overview
                </h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  ZeroKeyCI enables secure smart contract deployment without
                  exposing private keys in your CI/CD pipeline. Here&apos;s what
                  you need:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>A GitHub repository with your smart contracts</li>
                  <li>A Gnosis Safe multisig wallet</li>
                  <li>GitHub Actions enabled in your repository</li>
                  <li>Hardhat for contract compilation</li>
                </ul>
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Initial Setup
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      1. Configure GitHub Secrets
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`# In GitHub repository settings:
Settings → Secrets → Actions → New repository secret

SAFE_ADDRESS=0x742D35CC6634c0532925A3b844BC9E7595F0BEb0`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      2. Create Deployment Configuration
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`# .zerokey/deploy.yaml
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
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      3. Set Up OPA Policies
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`# .zerokey/policy.rego
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
                <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Deployment Process
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      1. Create Your Contract
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`// contracts/YourContract.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract YourContract is UUPSUpgradeable {
    // Your contract logic
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      2. Create PR with Deploy Label
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`git checkout -b feat/deploy-contract
git add contracts/
git commit -m "feat: add YourContract"
git push origin feat/deploy-contract

# Create PR on GitHub and add 'deploy' label`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      3. CI Generates Proposal
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      When you merge the PR, GitHub Actions will:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                      <li>Compile your contracts</li>
                      <li>Generate Safe transaction proposal</li>
                      <li>Upload proposal as artifact</li>
                      <li>Comment on PR with details</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      4. Sign and Execute
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Safe owners review the proposal, sign the transaction, and
                      execute deployment once threshold is met.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Local Testing
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      Run Local Test Script
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`# Test SafeProposalBuilder locally
bun run scripts/test-local-deployment.ts

# Output:
# ✅ Proposal created successfully
# ✅ Validation result: Valid
# 📍 Expected deployment address: 0x7b9244...
# 💾 Proposal saved to: test-safe-proposal.json`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      Run Test Suite
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`# Run all tests with coverage
bun run test:coverage

# Run validation checks
make before_commit`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                      Verify Proposal
                    </h4>
                    <pre className="glass-medium rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200">{`# Check generated proposal
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

      {/* Interactive Sandbox Section */}
      <section className="relative px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <SafeProposalSandbox />
        </div>
      </section>

      {/* Architecture Section */}
      <section className="relative px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            System Architecture
          </h2>
          <div className="glass-strong rounded-3xl p-8">
            <pre className="text-sm text-gray-700 dark:text-gray-200 overflow-x-auto">
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
      <footer className="relative px-6 py-12 text-center">
        <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Built with security and simplicity in mind
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="https://github.com/susumutomita/ZeroKeyCI"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://github.com/susumutomita/ZeroKeyCI/issues"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Issues
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
