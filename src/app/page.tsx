'use client';

import { useState } from 'react';
import SafeProposalSandbox from '@/components/SafeProposalSandbox';
import GitHubSetupWizard from '@/components/GitHubSetupWizard';
import { useTranslations, type Language } from '@/lib/i18n';
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
  Globe,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('problem');
  const [language, setLanguage] = useState<Language>('en');
  const t = useTranslations(language);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full blur-3xl animate-float-slow" />

      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <div className="flex gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
              language === 'en'
                ? 'bg-white text-slate-900'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4" />
            EN
          </button>
          <button
            onClick={() => setLanguage('ja')}
            className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
              language === 'ja'
                ? 'bg-white text-slate-900'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4" />
            日本語
          </button>
        </div>
      </div>

      {/* Hero Section - The Problem */}
      <section className="relative min-h-screen flex items-center">
        <div className="container mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-6 py-3 mb-8 animate-fade-in-up">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">
                {t.hero.badge}
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-8 animate-scale-in bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 whitespace-pre-line">
              {t.hero.title}
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="flex gap-6 justify-center flex-wrap mb-16">
              <a
                href="#setup"
                className="group px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-xl text-white shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Rocket className="w-6 h-6" />
                {t.hero.getStarted}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#demo"
                className="px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-xl text-white transition-all duration-300 hover:scale-105"
              >
                {t.hero.tryDemo}
              </a>
            </div>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: t.benefits.multiSig.title,
                  desc: t.benefits.multiSig.desc,
                  color: 'blue',
                },
                {
                  icon: FileText,
                  title: t.benefits.auditTrail.title,
                  desc: t.benefits.auditTrail.desc,
                  color: 'purple',
                },
                {
                  icon: CheckCircle2,
                  title: t.benefits.policy.title,
                  desc: t.benefits.policy.desc,
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
                  {t.solution.badge}
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-6 text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                  {t.solution.title}
                </span>
              </h2>
              <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
                {t.solution.subtitle}
              </p>
            </div>

            {/* Value Props */}
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              {[
                {
                  icon: Shield,
                  title: t.solution.features.zeroKeys.title,
                  desc: t.solution.features.zeroKeys.desc,
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: Users,
                  title: t.solution.features.multiSig.title,
                  desc: t.solution.features.multiSig.desc,
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  icon: FileText,
                  title: t.solution.features.auditTrail.title,
                  desc: t.solution.features.auditTrail.desc,
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  icon: Zap,
                  title: t.solution.features.github.title,
                  desc: t.solution.features.github.desc,
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
              {t.howItWorks.title}
            </h2>

            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-blue-500 to-emerald-500 hidden md:block" />

              {t.howItWorks.steps
                .map((step, idx) => {
                  const icons = [Code, Activity, FileText, Users, Zap];
                  const colors = ['blue', 'purple', 'pink', 'green', 'orange'];
                  const sides = ['left', 'right', 'left', 'right', 'left'];
                  return {
                    num: `0${idx + 1}`,
                    title: step.title,
                    desc: step.desc,
                    icon: icons[idx],
                    color: colors[idx],
                    side: sides[idx],
                  };
                })
                .map((step, idx) => (
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

      {/* Why It's Safe Section */}
      <section className="relative py-32 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-6 py-3 mb-8">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-semibold">
                  {t.whyItsSafe.badge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                {t.whyItsSafe.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {t.whyItsSafe.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  key: 'distributedKeys',
                  icon: RefreshCw,
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  key: 'multisig',
                  icon: Users,
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  key: 'conditionalSigning',
                  icon: CheckCircle2,
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  key: 'auditTrail',
                  icon: FileText,
                  gradient: 'from-orange-500 to-red-500',
                },
              ].map((item, idx) => {
                const section =
                  t.whyItsSafe.sections[
                    item.key as keyof typeof t.whyItsSafe.sections
                  ];
                return (
                  <div
                    key={item.key}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {section.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {section.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Lit Protocol Technical Deep Dive */}
      <section className="relative py-32 bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-6 py-3 mb-8">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-300 font-semibold">
                  {t.litProtocol.badge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                {t.litProtocol.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                {t.litProtocol.subtitle}
              </p>
              <p className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed">
                {t.litProtocol.intro}
              </p>
            </div>

            {/* PKP Architecture Timeline */}
            <div className="mb-24">
              <h3 className="text-4xl font-bold text-center mb-16 text-white">
                {t.litProtocol.architecture.title}
              </h3>

              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 hidden md:block" />

                {t.litProtocol.architecture.steps.map((step, idx) => (
                  <div
                    key={step.num}
                    className={`relative mb-16 md:mb-20 ${
                      idx % 2 === 0 ? 'md:pr-[55%]' : 'md:pl-[55%]'
                    }`}
                  >
                    {/* Number badge */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-cyan-600 to-purple-600 rounded-full items-center justify-center text-white font-black text-2xl shadow-2xl shadow-cyan-500/50 z-10 border-4 border-slate-900">
                      {step.num}
                    </div>

                    <div
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.15}s` }}
                    >
                      <h4 className="text-2xl font-bold text-white mb-4">
                        {step.title}
                      </h4>
                      <p className="text-gray-400 leading-relaxed text-lg">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flow Diagram */}
            <div className="mb-24">
              <h3 className="text-4xl font-bold text-center mb-16 text-white">
                {t.litProtocol.flow.title}
              </h3>

              <div className="grid md:grid-cols-5 gap-4">
                {t.litProtocol.flow.steps.map((step, idx) => {
                  const icons = {
                    GitBranch,
                    Activity,
                    Zap,
                    RefreshCw,
                    Shield,
                  };
                  const IconComponent = icons[step.icon as keyof typeof icons];

                  return (
                    <div key={idx} className="relative">
                      <div
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 h-full flex flex-col animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-xl">
                          {IconComponent && (
                            <IconComponent className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3 text-center">
                          {step.title}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed text-center flex-grow">
                          {step.desc}
                        </p>
                      </div>
                      {/* Arrow between steps */}
                      {idx < t.litProtocol.flow.steps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 text-cyan-400 z-20">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Guarantees */}
            <div>
              <h3 className="text-4xl font-bold text-center mb-16 text-white">
                {t.litProtocol.security.title}
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {t.litProtocol.security.points.map((point, idx) => (
                  <div
                    key={point.title}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-3">
                          {point.title}
                        </h4>
                        <p className="text-gray-400 leading-relaxed">
                          {point.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Limitations Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-6 py-3 mb-8">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-300 font-semibold">
                  {t.currentLimitations.badge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                {t.currentLimitations.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {t.currentLimitations.subtitle}
              </p>
            </div>

            <div className="space-y-6">
              {[
                { key: 'pkpIntegration', color: 'yellow' },
                { key: 'networkSupport', color: 'green' },
                { key: 'gasEstimation', color: 'blue' },
                { key: 'upgradeable', color: 'purple' },
              ].map((item, idx) => {
                const limitation =
                  t.currentLimitations.items[
                    item.key as keyof typeof t.currentLimitations.items
                  ];
                const statusColors = {
                  yellow: {
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/20',
                    text: 'text-yellow-400',
                    badge: 'bg-yellow-500/20',
                  },
                  green: {
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/20',
                    text: 'text-green-400',
                    badge: 'bg-green-500/20',
                  },
                  blue: {
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    text: 'text-blue-400',
                    badge: 'bg-blue-500/20',
                  },
                  purple: {
                    bg: 'bg-purple-500/10',
                    border: 'border-purple-500/20',
                    text: 'text-purple-400',
                    badge: 'bg-purple-500/20',
                  },
                };
                const colors =
                  statusColors[item.color as keyof typeof statusColors];

                return (
                  <div
                    key={item.key}
                    className={`${colors.bg} backdrop-blur-sm border ${colors.border} rounded-2xl p-8 hover:scale-105 transition-all duration-300 animate-fade-in-up`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-white">
                        {limitation.title}
                      </h3>
                      <span
                        className={`${colors.badge} ${colors.text} px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap`}
                      >
                        {limitation.status}
                      </span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      {limitation.desc}
                    </p>
                  </div>
                );
              })}
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
                {t.demo.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {t.demo.subtitle}
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
                  {t.setup.badge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white whitespace-pre-line">
                {t.setup.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {t.setup.subtitle}
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
              {t.whyMatters.title}
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
                    {tab === 'problem'
                      ? t.whyMatters.tabs.problem
                      : tab === 'traditional'
                        ? t.whyMatters.tabs.traditional
                        : t.whyMatters.tabs.zerokey}
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
            <h2 className="text-5xl md:text-6xl font-black mb-8 text-white whitespace-pre-line">
              {t.cta.title}
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              {t.cta.subtitle}
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="group px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-xl text-white shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <GitBranch className="w-6 h-6" />
                {t.cta.github}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
              {[
                { num: '0', label: t.cta.stats.privateKeys, icon: Lock },
                { num: '100%', label: t.cta.stats.openSource, icon: Code },
                { num: '∞', label: t.cta.stats.peace, icon: Shield },
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
            <p className="text-gray-400 mb-8">{t.footer.tagline}</p>
            <div className="flex justify-center gap-8 flex-wrap">
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="text-lg font-semibold text-gray-400 hover:text-white transition-colors"
              >
                {t.footer.links.github}
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/PRODUCTION-SETUP.md"
                className="text-lg font-semibold text-gray-400 hover:text-white transition-colors"
              >
                {t.footer.links.docs}
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/issues"
                className="text-lg font-semibold text-gray-400 hover:text-white transition-colors"
              >
                {t.footer.links.issues}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
