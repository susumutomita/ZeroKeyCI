'use client';

import { useState } from 'react';
import SafeProposalSandbox from '@/components/SafeProposalSandbox';
import GitHubSetupWizard from '@/components/GitHubSetupWizard';
import {
  Lock,
  CheckCircle2,
  FileText,
  RefreshCw,
  Target,
  AlertTriangle,
  Shield,
  GitBranch,
  Users,
  Zap,
  ArrowRight,
  Code,
  Activity,
  Rocket,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('problem');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full blur-3xl animate-float-slow" />

      {/* Hero Section - The Problem */}
      <section className="relative min-h-screen flex items-center">
        <div className="container mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-6 py-3 mb-8 animate-fade-in-up">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">
                Secure Smart Contract Deployment
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-8 animate-scale-in bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400">
              Deploy Contracts
              <br />
              Without Private Keys
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Secure CI/CD deployment using Gnosis Safe multisig. No private
              keys in your pipeline, full audit trail, multi-signature approval.
            </p>

            <div className="flex gap-6 justify-center flex-wrap mb-16">
              <a
                href="#setup"
                className="group px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-xl text-white shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Rocket className="w-6 h-6" />
                Get Started in 3 Minutes
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#demo"
                className="px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-xl text-white transition-all duration-300 hover:scale-105"
              >
                Try Demo
              </a>
            </div>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: 'Multi-Signature Security',
                  desc: 'Require multiple approvals for every deployment',
                  color: 'blue',
                },
                {
                  icon: FileText,
                  title: 'Complete Audit Trail',
                  desc: 'Every action tracked on-chain with full transparency',
                  color: 'purple',
                },
                {
                  icon: CheckCircle2,
                  title: 'Policy Enforcement',
                  desc: 'OPA policies ensure compliance and security standards',
                  color: 'green',
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/20 rounded-xl flex items-center justify-center mb-4 mx-auto`}
                  >
                    <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section id="solution" className="relative py-32 bg-black/30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3 mb-8">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-semibold">
                  The Solution
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-6 text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                  ZeroKeyCI
                </span>
              </h2>
              <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
                Deploy smart contracts without{' '}
                <span className="text-white font-bold">ever</span> exposing
                private keys in CI/CD
              </p>
            </div>

            {/* Value Props */}
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              {[
                {
                  icon: Shield,
                  title: 'Zero Private Keys in CI',
                  desc: 'Private keys never touch your GitHub Actions. All signing happens through Gnosis Safe multisig - the gold standard for treasury management.',
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: Users,
                  title: 'Multi-Signature Security',
                  desc: 'Require 2-of-3, 3-of-5, or any threshold. One compromised account cannot deploy malicious code.',
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  icon: FileText,
                  title: 'Complete Audit Trail',
                  desc: 'Every deployment tracked from PR to blockchain. Know exactly who approved what, when, and why.',
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  icon: Zap,
                  title: 'Seamless GitHub Integration',
                  desc: 'Add a label to your PR. CI generates the proposal. Safe owners approve. Done. No complex setup.',
                  gradient: 'from-orange-500 to-red-500',
                },
              ].map((feature, idx) => (
                <div
                  key={feature.title}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Actually Works - Visual Flow */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-center mb-20 text-white">
              How It{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                Actually
              </span>{' '}
              Works
            </h2>

            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-blue-500 to-emerald-500 hidden md:block" />

              {[
                {
                  num: '01',
                  title: 'Developer Creates PR',
                  desc: 'Write your smart contract, create a PR, add the "deploy" label. That\'s it.',
                  icon: Code,
                  color: 'blue',
                  side: 'left',
                },
                {
                  num: '02',
                  title: 'GitHub Actions Compiles & Validates',
                  desc: 'CI compiles your contract, runs tests, validates with OPA policies. All without any private keys.',
                  icon: Activity,
                  color: 'purple',
                  side: 'right',
                },
                {
                  num: '03',
                  title: 'Generates Safe Transaction Proposal',
                  desc: 'Creates unsigned transaction proposal with your deployment parameters. Posted as PR comment.',
                  icon: FileText,
                  color: 'pink',
                  side: 'left',
                },
                {
                  num: '04',
                  title: 'Safe Owners Review & Sign',
                  desc: 'Multiple signers review the exact bytecode, constructor args, and deployment config. Sign when confident.',
                  icon: Users,
                  color: 'green',
                  side: 'right',
                },
                {
                  num: '05',
                  title: 'Deployed to Blockchain',
                  desc: 'Once threshold is met, contract is deployed. Full audit trail from code to chain.',
                  icon: Zap,
                  color: 'orange',
                  side: 'left',
                },
              ].map((step, idx) => (
                <div
                  key={step.num}
                  className={`relative mb-16 md:mb-24 ${
                    step.side === 'left' ? 'md:pr-[55%]' : 'md:pl-[55%]'
                  }`}
                >
                  {/* Number badge on the line */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full items-center justify-center text-white font-black text-xl shadow-2xl z-10">
                    {step.num}
                  </div>

                  <div
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                          {step.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section
        id="demo"
        className="relative py-32 bg-gradient-to-br from-cyan-900/20 to-blue-900/20"
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                Try It{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                  Right Now
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Generate a real Safe transaction proposal in your browser. No
                wallet required.
              </p>
            </div>

            <SafeProposalSandbox />
          </div>
        </div>
      </section>

      {/* Setup Wizard Section */}
      <section id="setup" className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3 mb-8">
                <Rocket className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-semibold">
                  3-Minute Setup
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                Deploy Your First Contract
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                  In 3 Minutes
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Configure your Safe address, download the files, and start
                deploying with enterprise-grade security.
              </p>
            </div>

            <GitHubSetupWizard />
          </div>
        </div>
      </section>

      {/* Problem/Solution Tabs */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-black text-center mb-12 text-white">
              Why This Matters
            </h2>

            <div className="flex justify-center mb-12">
              <div className="inline-flex gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
                {['problem', 'traditional', 'zerokey'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-4 rounded-xl capitalize font-semibold transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-2xl'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab === 'zerokey' ? 'With ZeroKeyCI' : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
              {activeTab === 'problem' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-blue-400 mb-6">
                    Traditional Approach: Challenges
                  </h3>
                  <div className="space-y-4 text-gray-300">
                    <p className="text-lg leading-relaxed">
                      <strong className="text-white">
                        Common patterns in Web3 CI/CD:
                      </strong>{' '}
                      Private keys stored as GitHub secrets, accessible to
                      developers with repository access.
                    </p>
                    <ul className="space-y-3 list-none">
                      {[
                        'Shared secret access across team members',
                        'Access control requires key rotation',
                        'Limited visibility into deployment actions',
                        'Operational challenges with credential management',
                        'Dependencies on infrastructure security',
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-8">
                      <p className="text-blue-300 font-semibold">
                        Industry best practice: Multi-signature wallets provide
                        enhanced security through distributed key management and
                        approval workflows.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'traditional' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-yellow-400 mb-6">
                    Traditional Solution: Manual Deployments
                  </h3>
                  <div className="space-y-4 text-gray-300">
                    <p className="text-lg leading-relaxed">
                      <strong className="text-white">
                        The &quot;safe&quot; approach:
                      </strong>{' '}
                      CTO manually deploys from their laptop. No automation, no
                      CI/CD.
                    </p>
                    <ul className="space-y-3 list-none">
                      {[
                        'CTO becomes bottleneck - deployments wait days',
                        'Manual process = human error (wrong params, wrong network)',
                        'No reproducibility - "works on my machine"',
                        'Single point of failure - CTO on vacation? No deployments.',
                        "Still doesn't solve the private key problem",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mt-8">
                      <p className="text-yellow-300 font-semibold">
                        You can have security OR automation. Not both. Until
                        now.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'zerokey' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-green-400 mb-6">
                    ZeroKeyCI: Security + Automation
                  </h3>
                  <div className="space-y-4 text-gray-300">
                    <p className="text-lg leading-relaxed">
                      <strong className="text-white">
                        The best of both worlds:
                      </strong>{' '}
                      Fully automated CI/CD with enterprise-grade security
                      through Gnosis Safe.
                    </p>
                    <ul className="space-y-3 list-none">
                      {[
                        "Zero private keys in CI - impossible to leak what doesn't exist",
                        'Multi-sig approval - requires 2+ owners to deploy anything',
                        'Complete audit trail - every deployment tracked on-chain',
                        'Instant access revocation - remove signer from Safe, done',
                        'Policy enforcement - OPA validates every deployment',
                        'Seamless developer experience - just add a label to PR',
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mt-8">
                      <p className="text-green-300 font-semibold text-lg">
                        Same deployment speed. 100x better security. Zero
                        compromise.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-black mb-8 text-white">
              Ready to Deploy
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                Without Fear?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Start deploying with multi-signature security and full audit
              trails
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="group px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-xl text-white shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <GitBranch className="w-6 h-6" />
                View on GitHub
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
              {[
                { num: '0', label: 'Private Keys in CI', icon: Lock },
                { num: '100%', label: 'Open Source', icon: Code },
                { num: '∞', label: 'Peace of Mind', icon: Shield },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <stat.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                  <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">
                    {stat.num}
                  </div>
                  <div className="text-gray-400 font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-t border-white/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400 mb-8">
              Built with security and developer experience in mind
            </p>
            <div className="flex justify-center gap-8 flex-wrap">
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="text-lg font-semibold text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/PRODUCTION-SETUP.md"
                className="text-lg font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/issues"
                className="text-lg font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Issues
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
