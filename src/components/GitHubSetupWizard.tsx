'use client';

import { useState } from 'react';
import {
  GitBranch,
  Copy,
  Check,
  Download,
  ArrowRight,
  Github,
  Settings,
  FileCode,
} from 'lucide-react';

export default function GitHubSetupWizard() {
  const [safeAddress, setSafeAddress] = useState('');
  const [network, setNetwork] = useState('sepolia');
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const workflowYaml = `name: ZeroKeyCI Deployment

on:
  pull_request:
    types: [labeled, synchronize]

jobs:
  deploy-proposal:
    if: contains(github.event.pull_request.labels.*.name, 'deploy')
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Compile contracts
        run: bunx hardhat compile

      - name: Generate Safe Proposal
        env:
          SAFE_ADDRESS: \${{ secrets.SAFE_ADDRESS }}
          NETWORK: ${network}
        run: |
          bun run scripts/create-safe-proposal.ts

      - name: Upload Proposal
        uses: actions/upload-artifact@v4
        with:
          name: safe-proposal
          path: safe-proposal.json

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const proposal = JSON.parse(fs.readFileSync('safe-proposal.json', 'utf8'));

            const comment = \`## 🔐 Safe Deployment Proposal Generated

            **Contract**: \${proposal.metadata.contractName}
            **Network**: \${proposal.metadata.network}
            **Safe Address**: \${proposal.metadata.safeAddress}

            ### Transaction Details
            \\\`\\\`\\\`json
            {
              "to": "\${proposal.transaction.to}",
              "value": "\${proposal.transaction.value}",
              "data": "\${proposal.transaction.data.substring(0, 66)}..."
            }
            \\\`\\\`\\\`

            ### Next Steps
            1. Download the proposal artifact from this workflow run
            2. Review the transaction details carefully
            3. Import into Gnosis Safe for signing
            4. Once threshold is met, execute the deployment

            **Validation Hash**: \`\${proposal.validationHash}\`
            \`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
`;

  const envExample = `# ZeroKeyCI Environment Variables

# REQUIRED: Your Gnosis Safe multisig address
SAFE_ADDRESS=${safeAddress || '0x742D35CC6634c0532925A3b844BC9E7595F0BEb0'}

# Network for deployment
NETWORK=${network}

# Storage configuration (optional)
STORAGE_TYPE=file
STORAGE_DIR=.zerokey/storage

# Node environment
NODE_ENV=production
`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-12">
        {[
          { num: 1, label: 'Configure', icon: Settings },
          { num: 2, label: 'Download Files', icon: Download },
          { num: 3, label: 'Setup GitHub', icon: Github },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                  step >= s.num
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white scale-110'
                    : 'bg-white/10 text-gray-500'
                }`}
              >
                <s.icon className="w-6 h-6" />
              </div>
              <span
                className={`text-sm mt-2 font-semibold ${
                  step >= s.num ? 'text-white' : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < 2 && (
              <div
                className={`h-1 flex-1 mx-4 transition-all duration-300 ${
                  step > s.num
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
                    : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Configuration */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              Configure Your Deployment
            </h3>
            <p className="text-gray-400 mb-8">
              Enter your Gnosis Safe address and select your deployment network.
            </p>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              Gnosis Safe Address
            </label>
            <input
              type="text"
              value={safeAddress}
              onChange={(e) => setSafeAddress(e.target.value)}
              placeholder="0x742D35CC6634c0532925A3b844BC9E7595F0BEb0"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <p className="text-gray-500 text-sm mt-2">
              The multisig wallet that will control deployments
            </p>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              Network
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="sepolia">Sepolia (Testnet)</option>
              <option value="mainnet">Ethereum Mainnet</option>
              <option value="polygon">Polygon</option>
              <option value="optimism">Optimism</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
            </select>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!safeAddress}
            className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 group"
          >
            Next: Download Files
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Step 2: Download Files */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              Download Configuration Files
            </h3>
            <p className="text-gray-400 mb-8">
              Download these files and add them to your repository.
            </p>
          </div>

          {/* GitHub Actions Workflow */}
          <div className="bg-black/30 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">
                    .github/workflows/deploy.yml
                  </h4>
                  <p className="text-gray-500 text-sm">
                    GitHub Actions workflow
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(workflowYaml, 'workflow')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-300 flex items-center gap-2"
                >
                  {copied === 'workflow' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownload(workflowYaml, 'deploy.yml')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-white transition-all duration-300 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 max-h-64">
              {workflowYaml}
            </pre>
          </div>

          {/* .env.example */}
          <div className="bg-black/30 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">.env.example</h4>
                  <p className="text-gray-500 text-sm">
                    Environment variables template
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(envExample, 'env')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-300 flex items-center gap-2"
                >
                  {copied === 'env' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownload(envExample, '.env.example')}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white transition-all duration-300 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-xs text-gray-300">
              {envExample}
            </pre>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-lg text-white transition-all duration-300"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 group"
            >
              Next: Setup GitHub
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: GitHub Setup Instructions */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              Complete GitHub Setup
            </h3>
            <p className="text-gray-400 mb-8">
              Follow these steps to integrate ZeroKeyCI into your repository.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                num: 1,
                title: 'Add files to your repository',
                desc: 'Place the downloaded files in your repository:',
                code: `# Create workflows directory
mkdir -p .github/workflows

# Add the workflow file
mv deploy.yml .github/workflows/

# Add environment template
mv .env.example .env.example

# Commit the files
git add .github/workflows/deploy.yml .env.example
git commit -m "feat: add ZeroKeyCI deployment workflow"
git push`,
              },
              {
                num: 2,
                title: 'Configure GitHub Secrets',
                desc: 'Add your Safe address to repository secrets:',
                steps: [
                  'Go to your repository on GitHub',
                  'Click Settings → Secrets and variables → Actions',
                  'Click "New repository secret"',
                  `Name: SAFE_ADDRESS, Value: ${safeAddress || 'your-safe-address'}`,
                  'Click "Add secret"',
                ],
              },
              {
                num: 3,
                title: 'Deploy your first contract',
                desc: 'Create a PR with the "deploy" label:',
                code: `# Create a new branch
git checkout -b feat/my-contract

# Add your contract
# Edit contracts/MyContract.sol

# Push and create PR
git add contracts/
git commit -m "feat: add MyContract"
git push origin feat/my-contract

# On GitHub: Create PR and add "deploy" label`,
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-black/30 rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">
                      {step.title}
                    </h4>
                    <p className="text-gray-400 mb-4">{step.desc}</p>
                    {step.code && (
                      <div className="relative">
                        <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-xs text-gray-300">
                          {step.code}
                        </pre>
                        <button
                          onClick={() =>
                            handleCopy(step.code!, `step-${step.num}`)
                          }
                          className="absolute top-2 right-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs transition-all duration-300 flex items-center gap-1"
                        >
                          {copied === `step-${step.num}` ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {step.steps && (
                      <ul className="space-y-2">
                        {step.steps.map((s, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-300"
                          >
                            <span className="text-blue-400 mt-1">→</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mt-8">
            <div className="flex items-start gap-4">
              <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  You&apos;re All Set!
                </h4>
                <p className="text-gray-300">
                  Once you create a PR with the &quot;deploy&quot; label, GitHub
                  Actions will automatically generate a Safe proposal. Review
                  it, sign with your Safe owners, and deploy!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-lg text-white transition-all duration-300"
            >
              Back
            </button>
            <a
              href="https://github.com/susumutomita/ZeroKeyCI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 group"
            >
              <GitBranch className="w-5 h-5" />
              View Full Documentation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
