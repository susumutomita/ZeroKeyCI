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

    // Why it's safe
    whyItsSafe: {
      badge: 'Security Model',
      title: "Why It's Safe",
      subtitle:
        'Understanding the cryptographic foundation that eliminates single points of failure',
      sections: {
        distributedKeys: {
          title: 'Distributed Key Generation',
          desc: "Lit Protocol PKPs use threshold cryptography. The private key never exists in full - it's distributed across Lit Protocol's decentralized network. No single node can sign transactions alone.",
        },
        multisig: {
          title: 'Multi-Signature Requirements',
          desc: 'PKP is configured as ONE owner in a 2-of-3 Gnosis Safe multisig. Even if the PKP were compromised, attackers would need to compromise additional human owners to deploy malicious code.',
        },
        conditionalSigning: {
          title: 'Conditional Signing Logic',
          desc: 'Lit Actions enforce conditions: OPA policies passed, tests passed, PR merged. The PKP cannot sign unless all conditions are met. This is enforced cryptographically, not just in code.',
        },
        auditTrail: {
          title: 'Complete Transparency',
          desc: 'Every signature request, every condition check, every deployment is logged on-chain. You can audit exactly who approved what, when, and under what conditions.',
        },
      },
    },

    // Lit Protocol Technical Details
    litProtocol: {
      badge: 'Technical Deep Dive',
      title: 'How Lit Protocol Powers Keyless CI/CD',
      subtitle:
        'Understanding the cryptographic foundation that makes automated signing possible without private keys',
      intro:
        "ZeroKeyCI uses Lit Protocol's Programmable Key Pairs (PKPs) to enable automated transaction signing in CI/CD without ever exposing private keys. Here's how it works:",
      architecture: {
        title: 'PKP Architecture',
        steps: [
          {
            num: '01',
            title: 'Distributed Key Generation',
            desc: 'When you mint a PKP NFT, Lit Protocol generates an ECDSA key pair using threshold cryptography across its decentralized network. The private key never exists in full - each Lit node holds only a share.',
          },
          {
            num: '02',
            title: 'NFT Ownership',
            desc: 'The PKP public key is tied to an NFT you own. This NFT grants permission to execute Lit Actions that can request signatures from the distributed PKP.',
          },
          {
            num: '03',
            title: 'Lit Actions: Conditional Logic',
            desc: "You write JavaScript code (Lit Actions) that runs inside Lit Protocol's network. This code verifies conditions (OPA policies, tests, PR status) before requesting a signature.",
          },
          {
            num: '04',
            title: 'Threshold Signing',
            desc: 'If conditions pass, Lit nodes execute your Lit Action. Each node uses its key share to create a signature share. These shares are combined to produce the final ECDSA signature.',
          },
          {
            num: '05',
            title: 'Safe Integration',
            desc: 'The PKP address is added as one owner in a Gnosis Safe multisig (e.g., 2-of-3). Even with automated PKP signing, you still need human approval to execute transactions.',
          },
        ],
      },
      flow: {
        title: 'ZeroKeyCI + Lit Protocol Flow',
        steps: [
          {
            icon: 'GitBranch',
            title: 'Developer merges PR',
            desc: 'PR with "deploy" label is merged after code review and tests pass.',
          },
          {
            icon: 'Activity',
            title: 'CI generates Safe proposal',
            desc: 'GitHub Actions compiles contract, runs OPA validation, creates unsigned Safe transaction proposal.',
          },
          {
            icon: 'Zap',
            title: 'Lit Action executes validation',
            desc: 'CI triggers Lit Protocol. Lit Action verifies: OPA policy passed, all tests green, PR merged. If any check fails, signature is refused.',
          },
          {
            icon: 'RefreshCw',
            title: 'Distributed signing',
            desc: 'Lit nodes create signature shares using their PKP key shares. Shares are combined into a valid ECDSA signature.',
          },
          {
            icon: 'Shield',
            title: 'Safe multisig approval',
            desc: 'PKP signature counts as 1-of-N. Human owners review and approve (threshold must be ≥2). Transaction executes when threshold is met.',
          },
        ],
      },
      security: {
        title: 'Security Guarantees',
        points: [
          {
            title: 'No Private Key Exposure',
            desc: "The PKP private key never exists in full anywhere - not in CI, not in code, not in memory. It's mathematically distributed across Lit Protocol nodes.",
          },
          {
            title: 'Conditional Signing Only',
            desc: "Lit Actions enforce rules cryptographically. The PKP cannot sign unless all conditions (OPA, tests, PR) pass. This is verified by Lit Protocol's network, not just your code.",
          },
          {
            title: 'Multisig as Safety Net',
            desc: 'Even if someone compromised the Lit Action code, they cannot deploy malicious contracts alone. Human Safe owners must still approve every transaction.',
          },
          {
            title: 'Complete Audit Trail',
            desc: 'Every signature request to Lit Protocol is logged. Every Safe transaction is on-chain. You can audit exactly what conditions were met, when, and who approved.',
          },
        ],
      },
    },

    // Current limitations
    currentLimitations: {
      badge: 'Roadmap',
      title: 'Current Limitations',
      subtitle: "What's implemented, what's in progress, and what's planned",
      items: {
        pkpIntegration: {
          status: 'Available (Optional)',
          title: 'Lit Protocol PKP Integration',
          desc: 'PKP-based automated signing is fully implemented and available. See docs/PKP_SETUP.md for setup instructions. Defaults to manual Safe multisig approval.',
        },
        networkSupport: {
          status: 'Implemented',
          title: 'Multi-Network & Testnet Support',
          desc: '10 networks supported: 5 mainnets (Ethereum, Polygon, Arbitrum, Optimism, Base) + 5 testnets (Sepolia, Polygon Amoy, Arbitrum Sepolia, Optimism Sepolia, Base Sepolia). Multi-chain deployment with single configuration.',
        },
        gasEstimation: {
          status: 'Implemented',
          title: 'Automatic Gas Estimation & Optimization',
          desc: 'Real-time gas price fetching, deployment cost estimation, network comparison, and optimization recommendations integrated into CI/CD workflow.',
        },
        upgradeable: {
          status: 'Implemented',
          title: 'Upgradeable Contract Support',
          desc: 'Full support for UUPS and Transparent proxy deployments with batch proposals. UUPS proxy upgrades supported. See docs/UPGRADEABLE_CONTRACTS.md for details.',
        },
      },
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

    // なぜ安全か
    whyItsSafe: {
      badge: 'セキュリティモデル',
      title: 'なぜ安全なのか',
      subtitle: '単一障害点を排除する暗号技術の基盤を理解する',
      sections: {
        distributedKeys: {
          title: '分散鍵生成',
          desc: 'Lit Protocol PKPは閾値暗号を使用。秘密鍵は完全な形では存在せず、Lit Protocolの分散ネットワーク全体に分散。単一ノードだけではトランザクションに署名できません。',
        },
        multisig: {
          title: 'マルチシグ要件',
          desc: 'PKPは2-of-3 Gnosis Safe マルチシグの1オーナーとして構成。PKPが侵害されても、攻撃者は悪意のあるコードをデプロイするために追加の人間のオーナーを侵害する必要があります。',
        },
        conditionalSigning: {
          title: '条件付き署名ロジック',
          desc: 'Lit Actionsが条件を強制: OPAポリシー合格、テスト合格、PRマージ済み。すべての条件が満たされない限り、PKPは署名できません。これはコードではなく暗号学的に強制されます。',
        },
        auditTrail: {
          title: '完全な透明性',
          desc: 'すべての署名リクエスト、すべての条件チェック、すべてのデプロイがオンチェーンで記録。誰が、何を、いつ、どのような条件下で承認したかを正確に監査できます。',
        },
      },
    },

    // Lit Protocol技術詳細
    litProtocol: {
      badge: '技術詳細',
      title: 'Lit Protocolによる秘密鍵レスCI/CDの実現',
      subtitle: '秘密鍵なしで自動署名を可能にする暗号技術基盤の理解',
      intro:
        'ZeroKeyCIはLit ProtocolのProgrammable Key Pairs (PKPs)を使用して、秘密鍵を公開することなくCI/CDでの自動トランザクション署名を実現します。仕組みを説明します:',
      architecture: {
        title: 'PKPアーキテクチャ',
        steps: [
          {
            num: '01',
            title: '分散鍵生成',
            desc: 'PKP NFTをミントすると、Lit Protocolは分散ネットワーク全体で閾値暗号を使用してECDSA鍵ペアを生成します。秘密鍵は完全な形では決して存在せず、各Litノードがシェアのみを保持します。',
          },
          {
            num: '02',
            title: 'NFT所有権',
            desc: 'PKP公開鍵はあなたが所有するNFTに紐付けられています。このNFTは、分散PKPからの署名をリクエストできるLit Actionsの実行権限を付与します。',
          },
          {
            num: '03',
            title: 'Lit Actions: 条件付きロジック',
            desc: 'Lit Protocolのネットワーク内で実行されるJavaScriptコード（Lit Actions）を記述します。このコードは署名をリクエストする前に条件（OPAポリシー、テスト、PRステータス）を検証します。',
          },
          {
            num: '04',
            title: '閾値署名',
            desc: '条件が満たされると、LitノードがLit Actionを実行します。各ノードは鍵シェアを使用して署名シェアを作成します。これらのシェアは結合されて最終的なECDSA署名を生成します。',
          },
          {
            num: '05',
            title: 'Safe統合',
            desc: 'PKPアドレスはGnosis Safeマルチシグ（例: 2-of-3）の1オーナーとして追加されます。自動PKP署名があっても、トランザクション実行には人間の承認が必要です。',
          },
        ],
      },
      flow: {
        title: 'ZeroKeyCI + Lit Protocolフロー',
        steps: [
          {
            icon: 'GitBranch',
            title: '開発者がPRをマージ',
            desc: 'コードレビューとテスト合格後、「deploy」ラベル付きPRがマージされます。',
          },
          {
            icon: 'Activity',
            title: 'CIがSafeプロポーザルを生成',
            desc: 'GitHub Actionsがコントラクトをコンパイルし、OPA検証を実行し、未署名のSafeトランザクションプロポーザルを作成します。',
          },
          {
            icon: 'Zap',
            title: 'Lit Actionが検証を実行',
            desc: 'CIがLit Protocolをトリガー。Lit ActionがOPAポリシー合格、全テスト成功、PRマージ済みを検証。どれか1つでも失敗すると署名を拒否します。',
          },
          {
            icon: 'RefreshCw',
            title: '分散署名',
            desc: 'LitノードがPKP鍵シェアを使用して署名シェアを作成。シェアは結合されて有効なECDSA署名になります。',
          },
          {
            icon: 'Shield',
            title: 'Safeマルチシグ承認',
            desc: 'PKP署名は1-of-Nとしてカウント。人間のオーナーがレビューして承認（閾値≥2必須）。閾値に達するとトランザクション実行。',
          },
        ],
      },
      security: {
        title: 'セキュリティ保証',
        points: [
          {
            title: '秘密鍵の非公開',
            desc: 'PKP秘密鍵は完全な形でどこにも存在しません - CIにも、コードにも、メモリにも。数学的にLit Protocolノード全体に分散されています。',
          },
          {
            title: '条件付き署名のみ',
            desc: 'Lit Actionsは暗号学的にルールを強制します。PKPはすべての条件（OPA、テスト、PR）が満たされない限り署名できません。これはLit Protocolのネットワークによって検証され、単なるコードではありません。',
          },
          {
            title: 'マルチシグがセーフティネット',
            desc: '誰かがLit Actionコードを侵害しても、単独で悪意のあるコントラクトをデプロイできません。人間のSafeオーナーがすべてのトランザクションを承認する必要があります。',
          },
          {
            title: '完全な監査証跡',
            desc: 'Lit Protocolへのすべての署名リクエストが記録されます。すべてのSafeトランザクションはオンチェーンです。どの条件が満たされたか、いつ、誰が承認したかを正確に監査できます。',
          },
        ],
      },
    },

    // 現在の制限
    currentLimitations: {
      badge: 'ロードマップ',
      title: '現在の制限',
      subtitle: '実装済み、進行中、計画中の機能',
      items: {
        pkpIntegration: {
          status: '利用可能（オプション）',
          title: 'Lit Protocol PKP統合',
          desc: 'PKPベースの自動署名は完全実装済みで利用可能です。セットアップ手順はdocs/PKP_SETUP.mdを参照してください。デフォルトは手動Safeマルチシグ承認です。',
        },
        networkSupport: {
          status: '実装済み',
          title: 'マルチネットワーク・テストネットサポート',
          desc: '10ネットワーク対応: 5メインネット（Ethereum、Polygon、Arbitrum、Optimism、Base）+ 5テストネット（Sepolia、Polygon Amoy、Arbitrum Sepolia、Optimism Sepolia、Base Sepolia）。単一設定でマルチチェーンデプロイ。',
        },
        gasEstimation: {
          status: '実装済み',
          title: '自動ガス推定・最適化',
          desc: 'リアルタイムガス価格取得、デプロイコスト推定、ネットワーク比較、最適化推奨をCI/CDワークフローに統合済み。',
        },
        upgradeable: {
          status: '実装済み',
          title: 'アップグレード可能コントラクトサポート',
          desc: 'UUPSとTransparentプロキシデプロイメントをバッチプロポーザルで完全サポート。UUPSプロキシのアップグレードに対応。詳細はdocs/UPGRADEABLE_CONTRACTS.mdを参照。',
        },
      },
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
