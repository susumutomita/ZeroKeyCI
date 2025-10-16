/**
 * Internationalization (i18n) configuration
 * Supports English and Japanese
 */

export type Language = 'en' | 'ja';

export const translations = {
  en: {
    // Hero section
    hero: {
      badge: 'Secure Smart Contract Deployment',
      title: 'Deploy Contracts\nWithout Private Keys',
      subtitle:
        'Secure CI/CD deployment using Gnosis Safe multisig. No private keys in your pipeline, full audit trail, multi-signature approval.',
      getStarted: 'Get Started in 3 Minutes',
      tryDemo: 'Try Demo',
    },

    // Key benefits
    benefits: {
      multiSig: {
        title: 'Multi-Signature Security',
        desc: 'Require multiple approvals for every deployment',
      },
      auditTrail: {
        title: 'Complete Audit Trail',
        desc: 'Every action tracked on-chain with full transparency',
      },
      policy: {
        title: 'Policy Enforcement',
        desc: 'OPA policies ensure compliance and security standards',
      },
    },

    // Solution section
    solution: {
      badge: 'The Solution',
      title: 'ZeroKeyCI',
      subtitle:
        'Deploy smart contracts without ever exposing private keys in CI/CD',
      features: {
        zeroKeys: {
          title: 'Zero Private Keys in CI',
          desc: 'Private keys never touch your GitHub Actions. All signing happens through Gnosis Safe multisig - the gold standard for treasury management.',
        },
        multiSig: {
          title: 'Multi-Signature Security',
          desc: 'Require 2-of-3, 3-of-5, or any threshold. One compromised account cannot deploy malicious code.',
        },
        auditTrail: {
          title: 'Complete Audit Trail',
          desc: 'Every deployment tracked from PR to blockchain. Know exactly who approved what, when, and why.',
        },
        github: {
          title: 'Seamless GitHub Integration',
          desc: 'Add a label to your PR. CI generates the proposal. Safe owners approve. Done. No complex setup.',
        },
      },
    },

    // How it works
    howItWorks: {
      title: 'How It Actually Works',
      steps: [
        {
          title: 'Developer Creates PR',
          desc: 'Write your smart contract, create a PR, add the "deploy" label. That\'s it.',
        },
        {
          title: 'GitHub Actions Compiles & Validates',
          desc: 'CI compiles your contract, runs tests, validates with OPA policies. All without any private keys.',
        },
        {
          title: 'Generates Safe Transaction Proposal',
          desc: 'Creates unsigned transaction proposal with your deployment parameters. Posted as PR comment.',
        },
        {
          title: 'Safe Owners Review & Sign',
          desc: 'Multiple signers review the exact bytecode, constructor args, and deployment config. Sign when confident.',
        },
        {
          title: 'Deployed to Blockchain',
          desc: 'Once threshold is met, contract is deployed. Full audit trail from code to chain.',
        },
      ],
    },

    // Demo section
    demo: {
      title: 'Try It Right Now',
      subtitle:
        'Generate a real Safe transaction proposal in your browser. No wallet required.',
    },

    // Setup section
    setup: {
      badge: '3-Minute Setup',
      title: 'Deploy Your First Contract\nIn 3 Minutes',
      subtitle:
        'Configure your Safe address, download the files, and start deploying with enterprise-grade security.',
    },

    // Why this matters
    whyMatters: {
      title: 'Why This Matters',
      tabs: {
        problem: 'problem',
        traditional: 'traditional',
        zerokey: 'With ZeroKeyCI',
      },
    },

    // CTA
    cta: {
      title: 'Ready to Deploy\nWithout Fear?',
      subtitle:
        'Start deploying with multi-signature security and full audit trails',
      github: 'View on GitHub',
      stats: {
        privateKeys: 'Private Keys in CI',
        openSource: 'Open Source',
        peace: 'Peace of Mind',
      },
    },

    // Footer
    footer: {
      tagline: 'Built with security and developer experience in mind',
      links: {
        github: 'GitHub',
        docs: 'Documentation',
        issues: 'Issues',
      },
    },
  },

  ja: {
    // ヒーローセクション
    hero: {
      badge: 'セキュアなスマートコントラクトデプロイ',
      title: '秘密鍵なしで\nコントラクトをデプロイ',
      subtitle:
        'Gnosis Safe マルチシグを使用した安全なCI/CDデプロイ。パイプラインに秘密鍵を保存せず、完全な監査証跡とマルチシグ承認を実現。',
      getStarted: '3分で始める',
      tryDemo: 'デモを試す',
    },

    // 主な利点
    benefits: {
      multiSig: {
        title: 'マルチシグセキュリティ',
        desc: 'すべてのデプロイに複数の承認が必要',
      },
      auditTrail: {
        title: '完全な監査証跡',
        desc: 'すべてのアクションがオンチェーンで完全に透明に記録',
      },
      policy: {
        title: 'ポリシー適用',
        desc: 'OPAポリシーでコンプライアンスとセキュリティ基準を保証',
      },
    },

    // ソリューションセクション
    solution: {
      badge: 'ソリューション',
      title: 'ZeroKeyCI',
      subtitle: 'CI/CDで秘密鍵を一切公開せずにスマートコントラクトをデプロイ',
      features: {
        zeroKeys: {
          title: 'CIに秘密鍵ゼロ',
          desc: '秘密鍵はGitHub Actionsに一切触れません。すべての署名はGnosis Safe マルチシグで行われます - 資金管理のゴールドスタンダード。',
        },
        multiSig: {
          title: 'マルチシグセキュリティ',
          desc: '2-of-3、3-of-5、または任意の閾値を要求。1つのアカウントが侵害されても悪意のあるコードはデプロイできません。',
        },
        auditTrail: {
          title: '完全な監査証跡',
          desc: 'PRからブロックチェーンまですべてのデプロイを追跡。誰が、何を、いつ、なぜ承認したかを正確に把握。',
        },
        github: {
          title: 'シームレスなGitHub統合',
          desc: 'PRにラベルを追加。CIがプロポーザルを生成。Safeオーナーが承認。完了。複雑な設定は不要。',
        },
      },
    },

    // 仕組み
    howItWorks: {
      title: '実際の動作方法',
      steps: [
        {
          title: '開発者がPRを作成',
          desc: 'スマートコントラクトを書き、PRを作成し、"deploy"ラベルを追加。それだけです。',
        },
        {
          title: 'GitHub Actionsがコンパイル＆検証',
          desc: 'CIがコントラクトをコンパイルし、テストを実行し、OPAポリシーで検証。すべて秘密鍵なしで。',
        },
        {
          title: 'Safeトランザクションプロポーザルを生成',
          desc: 'デプロイパラメータで未署名のトランザクションプロポーザルを作成。PRコメントとして投稿。',
        },
        {
          title: 'Safeオーナーがレビュー＆署名',
          desc: '複数の署名者が正確なバイトコード、コンストラクタ引数、デプロイ設定をレビュー。確信を持って署名。',
        },
        {
          title: 'ブロックチェーンにデプロイ',
          desc: '閾値に達すると、コントラクトがデプロイされます。コードからチェーンまで完全な監査証跡。',
        },
      ],
    },

    // デモセクション
    demo: {
      title: '今すぐ試す',
      subtitle:
        'ブラウザで実際のSafeトランザクションプロポーザルを生成。ウォレット不要。',
    },

    // セットアップセクション
    setup: {
      badge: '3分セットアップ',
      title: '最初のコントラクトを\n3分でデプロイ',
      subtitle:
        'Safeアドレスを設定し、ファイルをダウンロードし、エンタープライズグレードのセキュリティでデプロイを開始。',
    },

    // なぜ重要か
    whyMatters: {
      title: 'なぜ重要か',
      tabs: {
        problem: '問題',
        traditional: '従来の方法',
        zerokey: 'ZeroKeyCI の場合',
      },
    },

    // CTA
    cta: {
      title: '恐れずに\nデプロイする準備はできましたか？',
      subtitle: 'マルチシグセキュリティと完全な監査証跡でデプロイを開始',
      github: 'GitHubで見る',
      stats: {
        privateKeys: 'CIの秘密鍵',
        openSource: 'オープンソース',
        peace: '安心',
      },
    },

    // フッター
    footer: {
      tagline: 'セキュリティと開発者体験を重視して構築',
      links: {
        github: 'GitHub',
        docs: 'ドキュメント',
        issues: 'Issues',
      },
    },
  },
} as const;

export function useTranslations(lang: Language = 'en') {
  return translations[lang];
}
