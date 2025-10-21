'use client';

import { useState } from 'react';
import SafeProposalSandbox from '@/components/SafeProposalSandbox';
import Link from 'next/link';
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Liquid Glass Background - Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-float-slow" />

      {/* Language Switcher - Liquid Glass */}
      <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
        <div className="flex gap-0 glass rounded-xl p-0.5 shadow-glass">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
              language === 'en'
                ? 'glass-strong text-gray-900 dark:text-white shadow-glass scale-105'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:scale-105'
            }`}
          >
            <Globe className="w-4 h-4" />
            EN
          </button>
          <button
            onClick={() => setLanguage('ja')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
              language === 'ja'
                ? 'glass-strong text-gray-900 dark:text-white shadow-glass scale-105'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:scale-105'
            }`}
          >
            <Globe className="w-4 h-4" />
            日本語
          </button>
        </div>
      </div>

      {/* Hero Section - Liquid Glass */}
      <section className="relative min-h-screen flex items-center">
        <div className="container mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass-strong border border-blue-300/30 dark:border-blue-500/30 rounded-full px-5 py-2.5 mb-10 animate-fade-in-up shadow-glass">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">
                {t.hero.badge}
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-semibold mb-6 text-gray-900 dark:text-white whitespace-pre-line tracking-tight leading-[1.1] animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              {t.hero.title}
            </h1>

            <p
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-normal animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              {t.hero.subtitle}
            </p>

            <div
              className="flex gap-4 justify-center flex-wrap mb-20 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <a
                href="#setup"
                className="group btn-primary-modern flex items-center gap-2"
              >
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {t.hero.getStarted}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#demo" className="btn-secondary-modern">
                {t.hero.tryDemo}
              </a>
            </div>

            {/* Key Benefits - Liquid Glass */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: t.benefits.multiSig.title,
                  desc: t.benefits.multiSig.desc,
                },
                {
                  icon: FileText,
                  title: t.benefits.auditTrail.title,
                  desc: t.benefits.auditTrail.desc,
                },
                {
                  icon: CheckCircle2,
                  title: t.benefits.policy.title,
                  desc: t.benefits.policy.desc,
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-fade-in-up"
                  style={{ animationDelay: `${400 + idx * 100}ms` }}
                >
                  <div className="w-12 h-12 glass-medium rounded-xl flex items-center justify-center mb-5 shadow-glass">
                    <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section - Liquid Glass */}
      <section
        id="solution"
        className="relative py-32 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/30"
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 glass-strong border border-green-300/30 dark:border-green-500/30 rounded-full px-5 py-2.5 mb-8 animate-fade-in shadow-glass">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium text-sm">
                  {t.solution.badge}
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.solution.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed animate-fade-in">
                {t.solution.subtitle}
              </p>
            </div>

            {/* Value Props - Liquid Glass */}
            <div className="grid md:grid-cols-2 gap-6 mb-20">
              {[
                {
                  icon: Shield,
                  title: t.solution.features.zeroKeys.title,
                  desc: t.solution.features.zeroKeys.desc,
                },
                {
                  icon: Users,
                  title: t.solution.features.multiSig.title,
                  desc: t.solution.features.multiSig.desc,
                },
                {
                  icon: FileText,
                  title: t.solution.features.auditTrail.title,
                  desc: t.solution.features.auditTrail.desc,
                },
                {
                  icon: Zap,
                  title: t.solution.features.github.title,
                  desc: t.solution.features.github.desc,
                },
              ].map((feature, idx) => (
                <div
                  key={feature.title}
                  className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center mb-5 shadow-glass">
                    <feature.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Actually Works - Liquid Glass */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold text-center mb-20 text-gray-900 dark:text-white tracking-tight animate-fade-in">
              {t.howItWorks.title}
            </h2>

            <div className="relative">
              {/* Vertical connecting line - glass effect */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400/30 via-purple-400/30 to-pink-400/30 hidden md:block" />

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
                    {/* Number badge on the line - Liquid Glass */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full items-center justify-center text-white font-semibold text-sm shadow-glow z-10 animate-pulse">
                      {step.num}
                    </div>

                    <div className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-fade-in-up">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 glass-medium rounded-xl flex items-center justify-center flex-shrink-0 shadow-glass">
                          <step.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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

      {/* Why It's Safe Section - Liquid Glass */}
      <section className="relative py-32 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-blue-300/30 dark:border-blue-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-300 font-medium">
                  {t.whyItsSafe.badge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.whyItsSafe.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in">
                {t.whyItsSafe.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  key: 'distributedKeys',
                  icon: RefreshCw,
                },
                {
                  key: 'multisig',
                  icon: Users,
                },
                {
                  key: 'conditionalSigning',
                  icon: CheckCircle2,
                },
                {
                  key: 'auditTrail',
                  icon: FileText,
                },
              ].map((item, idx) => {
                const section =
                  t.whyItsSafe.sections[
                    item.key as keyof typeof t.whyItsSafe.sections
                  ];
                return (
                  <div
                    key={item.key}
                    className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center mb-6 shadow-glass">
                      <item.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-blue-300/30 dark:border-blue-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-300 font-medium">
                  {t.litProtocol.badge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.litProtocol.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in">
                {t.litProtocol.subtitle}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed animate-fade-in">
                {t.litProtocol.intro}
              </p>
            </div>

            {/* PKP Architecture Timeline */}
            <div className="mb-24">
              <h3 className="text-3xl font-semibold text-center mb-16 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.litProtocol.architecture.title}
              </h3>

              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400/30 via-purple-400/30 to-pink-400/30 hidden md:block" />

                {t.litProtocol.architecture.steps.map((step, idx) => (
                  <div
                    key={step.num}
                    className={`relative mb-16 md:mb-20 ${
                      idx % 2 === 0 ? 'md:pr-[55%]' : 'md:pl-[55%]'
                    }`}
                  >
                    {/* Number badge */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full items-center justify-center text-white font-semibold text-lg shadow-glow z-10 animate-pulse">
                      {step.num}
                    </div>

                    <div
                      className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        {step.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flow Diagram */}
            <div className="mb-24">
              <h3 className="text-3xl font-semibold text-center mb-16 text-gray-900 dark:text-white tracking-tight animate-fade-in">
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
                        className="glass-card p-6 border border-white/10 dark:border-white/5 glow-on-hover h-full flex flex-col animate-scale-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="w-12 h-12 glass-medium rounded-xl flex items-center justify-center mb-4 mx-auto shadow-glass">
                          {IconComponent && (
                            <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3 text-center">
                          {step.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-center flex-grow">
                          {step.desc}
                        </p>
                      </div>
                      {/* Arrow between steps */}
                      {idx < t.litProtocol.flow.steps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 text-blue-600 dark:text-blue-400 z-20">
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
              <h3 className="text-3xl font-semibold text-center mb-16 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.litProtocol.security.title}
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {t.litProtocol.security.points.map((point, idx) => (
                  <div
                    key={point.title}
                    className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 glass-medium rounded-xl flex items-center justify-center flex-shrink-0 shadow-glass">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {point.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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
      <section className="relative py-32 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-purple-300/30 dark:border-purple-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-600 dark:text-purple-300 font-medium">
                  {t.currentLimitations.badge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.currentLimitations.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in">
                {t.currentLimitations.subtitle}
              </p>
            </div>

            <div className="space-y-6">
              {[
                { key: 'pkpIntegration' },
                { key: 'networkSupport' },
                { key: 'gasEstimation' },
                { key: 'upgradeable' },
              ].map((item, idx) => {
                const limitation =
                  t.currentLimitations.items[
                    item.key as keyof typeof t.currentLimitations.items
                  ];

                return (
                  <div
                    key={item.key}
                    className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {limitation.title}
                      </h3>
                      <span className="glass-medium border border-blue-300/30 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-glass">
                        {limitation.status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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
      <section id="demo" className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-green-300/30 dark:border-green-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-300 font-medium">
                  Try It Live
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                {t.demo.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-fade-in">
                {t.demo.subtitle}
              </p>
            </div>

            <SafeProposalSandbox />
          </div>
        </div>
      </section>

      {/* Setup Wizard Section */}
      <section
        id="setup"
        className="relative py-32 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/30"
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-orange-300/30 dark:border-orange-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Rocket className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-600 dark:text-orange-300 font-medium">
                  {t.setup.badge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white whitespace-pre-line tracking-tight animate-fade-in">
                {t.setup.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-fade-in">
                {t.setup.subtitle}
              </p>
            </div>

            {/* Get Started Button - Links to Real GitHub Integration */}
            <div
              className="flex justify-center animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <Link href="/setup" className="group relative btn-primary-modern">
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Get Started Now
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-glow animate-pulse">
                  FREE
                </span>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                { num: '3 min', label: 'Setup Time' },
                { num: '0 keys', label: 'Private Keys Needed' },
                { num: '1 click', label: 'GitHub Integration' },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="glass-card p-6 border border-white/10 dark:border-white/5 text-center animate-scale-in"
                  style={{ animationDelay: `${300 + idx * 100}ms` }}
                >
                  <div className="text-4xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    {stat.num}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Tabs */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-semibold text-center mb-12 text-gray-900 dark:text-white tracking-tight animate-fade-in">
              {t.whyMatters.title}
            </h2>

            <div className="flex justify-center mb-12 animate-fade-in">
              <div className="inline-flex gap-2 glass rounded-xl p-1 shadow-glass">
                {['problem', 'traditional', 'zerokey'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-lg capitalize font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'glass-strong text-gray-900 dark:text-white shadow-glass scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:scale-105'
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

            <div className="glass-card border border-white/10 dark:border-white/5 rounded-2xl p-12 animate-fade-in">
              {activeTab === 'problem' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Traditional Approach: Challenges
                  </h3>
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <p className="text-base leading-relaxed">
                      <strong className="text-gray-900 dark:text-white">
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
                          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="glass-medium border border-blue-300/30 dark:border-blue-500/30 rounded-xl p-6 mt-8 shadow-glass">
                      <p className="text-blue-900 dark:text-blue-100 font-medium">
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
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Traditional Solution: Manual Deployments
                  </h3>
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <p className="text-base leading-relaxed">
                      <strong className="text-gray-900 dark:text-white">
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
                          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="glass-medium border border-orange-300/30 dark:border-orange-500/30 rounded-xl p-6 mt-8 shadow-glass">
                      <p className="text-orange-900 dark:text-orange-100 font-medium">
                        You can have security OR automation. Not both. Until
                        now.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'zerokey' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    ZeroKeyCI: Security + Automation
                  </h3>
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <p className="text-base leading-relaxed">
                      <strong className="text-gray-900 dark:text-white">
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
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="glass-medium border border-green-300/30 dark:border-green-500/30 rounded-xl p-6 mt-8 shadow-glass">
                      <p className="text-green-900 dark:text-green-100 font-medium text-base">
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

      {/* Lit Protocol PKP - Automated Signing */}
      <section className="relative py-32 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-purple-300/30 dark:border-purple-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-600 dark:text-purple-300 font-medium">
                  Automated Signing (Optional)
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                Lit Protocol PKP Integration
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in">
                Take automation to the next level with Programmable Key Pairs
                for conditional, trustless signing
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in">
                <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center mb-6 shadow-glass">
                  <Lock className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  No Exportable Private Keys
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  PKPs are non-custodial key pairs that execute signing logic
                  without ever exposing private keys. The keys literally cannot
                  be exported.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Distributed key generation across Lit nodes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Threshold signature scheme (MPC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>No single point of compromise</span>
                  </li>
                </ul>
              </div>

              <div
                className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                style={{ animationDelay: '100ms' }}
              >
                <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center mb-6 shadow-glass">
                  <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Conditional Signing Logic
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Lit Actions define the exact conditions for signing.
                  Deployments only proceed if all criteria are met.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>OPA policy validation required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>All tests must pass</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>PR approval checks enforced</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="glass-card border border-white/10 dark:border-white/5 rounded-2xl p-8 animate-fade-in">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-7 h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    100% Optional - Manual Signing Still Works
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    PKP integration is completely optional. ZeroKeyCI works
                    perfectly with manual Safe multisig approval. PKPs simply
                    add an automation layer for teams that want it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap - Future Features */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-strong border border-pink-300/30 dark:border-pink-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in shadow-glass">
                <Rocket className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <span className="text-pink-600 dark:text-pink-300 font-medium">
                  Coming Soon
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900 dark:text-white tracking-tight animate-fade-in">
                Roadmap
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in">
                We&apos;re continuously improving ZeroKeyCI with
                production-grade features
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center shadow-glass">
                    <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="glass-medium border border-gray-300/30 dark:border-gray-500/30 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium shadow-glass">
                    Q1 2026
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Gas Optimization
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Automatic gas optimization for contract deployments with cost
                  estimation and network-specific tuning.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Pre-deployment gas cost analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Bytecode optimization recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Network fee comparison (L1 vs L2)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Gas price monitoring and alerts</span>
                  </li>
                </ul>
              </div>

              <div
                className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center shadow-glass">
                    <RefreshCw className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="glass-medium border border-gray-300/30 dark:border-gray-500/30 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium shadow-glass">
                    Q2 2026
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Upgradeable Contracts
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Full support for proxy patterns and upgradeable contract
                  deployments with version management.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Transparent, UUPS, and Beacon proxy support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Storage layout collision detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Upgrade proposal workflows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Version history and rollback support</span>
                  </li>
                </ul>
              </div>

              <div
                className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                style={{ animationDelay: '200ms' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center shadow-glass">
                    <Activity className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="glass-medium border border-gray-300/30 dark:border-gray-500/30 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium shadow-glass">
                    Q1 2026
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Advanced Monitoring
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Real-time deployment dashboards and comprehensive analytics
                  for your Safe operations.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Deployment success/failure metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Safe transaction timeline visualization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Policy violation insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Team performance analytics</span>
                  </li>
                </ul>
              </div>

              <div
                className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                style={{ animationDelay: '300ms' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 glass-medium rounded-xl flex items-center justify-center shadow-glass">
                    <Globe className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="glass-medium border border-gray-300/30 dark:border-gray-500/30 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium shadow-glass">
                    Q3 2026
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Multi-Chain Support
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Deploy across 20+ EVM chains with unified management and
                  cross-chain coordination.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-600 dark:bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                    <span>All major L1s and L2s supported</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-600 dark:bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Cross-chain deployment coordination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-600 dark:bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Network-specific configuration profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-pink-600 dark:bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Unified Safe management interface</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 text-center animate-fade-in">
              <p className="text-gray-600 dark:text-gray-300 text-base mb-6">
                Have a feature request? We&apos;d love to hear from you.
              </p>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/issues/new"
                className="inline-flex items-center gap-2 btn-secondary-modern"
              >
                <Target className="w-5 h-5" />
                Request a Feature
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-semibold mb-8 text-gray-900 dark:text-white whitespace-pre-line tracking-tight animate-fade-in">
              {t.cta.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in">
              {t.cta.subtitle}
            </p>
            <div
              className="flex gap-6 justify-center flex-wrap animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="group btn-primary-modern flex items-center gap-2"
              >
                <GitBranch className="w-5 h-5" />
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
                  className="glass-card p-8 border border-white/10 dark:border-white/5 glow-on-hover animate-scale-in"
                  style={{ animationDelay: `${300 + idx * 100}ms` }}
                >
                  <stat.icon className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <div className="text-5xl font-semibold text-gray-900 dark:text-white mb-2">
                    {stat.num}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-t border-gray-200/50 dark:border-gray-700/50 glass">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-8 animate-fade-in">
              {t.footer.tagline}
            </p>
            <div className="flex justify-center gap-8 flex-wrap animate-fade-in">
              <a
                href="https://github.com/susumutomita/ZeroKeyCI"
                className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t.footer.links.github}
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/PRODUCTION-SETUP.md"
                className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t.footer.links.docs}
              </a>
              <a
                href="https://github.com/susumutomita/ZeroKeyCI/issues"
                className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
