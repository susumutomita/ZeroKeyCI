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
                Quick Setup Guide
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight">
              Start Deploying in 3 Minutes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              No OAuth, no complex setup. Just copy, paste, and deploy with zero
              private keys in CI/CD.
            </p>
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

          {/* Step 3: Merge & Deploy */}
          <div className="glass-card p-8 border border-white/10 dark:border-white/5 mb-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Merge PR & Deploy
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  When you merge a PR to main, ZeroKeyCI automatically creates a
                  Safe proposal. No private keys in CI!
                </p>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-300/30 dark:border-green-500/30 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    ✨ That&apos;s it! No private keys needed in CI/CD. Your
                    Safe owners sign proposals in the Safe UI.
                  </p>
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
