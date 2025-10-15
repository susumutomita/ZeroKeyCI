# ZeroKeyCI クイックスタートガイド

## 概要

ZeroKeyCI は、Gnosis Safe マルチシグを使用して、秘密鍵を一切 CI/CD に保存せずにスマートコントラクトをデプロイできる画期的なツールです。

**重要なポイント:**
- ✅ CI/CD に秘密鍵を保存しない（セキュリティリスクゼロ）
- ✅ マルチシグ承認による安全なデプロイメント
- ✅ 完全な監査証跡
- ✅ GitHub Actions とシームレスに統合

## 前提条件

### 1. 必要なもの

- **Gnosis Safe アドレス**:
  - テストネット（Sepolia）または本番環境（Mainnet）でデプロイ済みの Safe
  - 最低 2-of-3 マルチシグを推奨
  - https://app.safe.global で作成可能

- **GitHubリポジトリ**:
  - スマートコントラクトプロジェクト
  - GitHub Actions が有効

- **RPCエンドポイント**:
  - Infura、Alchemy、またはその他の RPC プロバイダー
  - 無料プランで OK

### 2. Gnosis Safeの作成

まだ Safe を持っていない場合:

1. https://app.safe.global にアクセス
2. ウォレットを接続（MetaMask 等）
3. 「Create new Safe」をクリック
4. ネットワークを選択（Sepolia 推奨）
5. オーナーを追加（最低 3 人推奨）
6. 閾値を設定（2-of-3 または 3-of-5 推奨）
7. Safe を作成
8. **Safeアドレスをコピー**（例: 0×1234...5678）

## ステップ1: プロジェクトの準備

### 1-1. Hardhatプロジェクトの確認

既存の Hardhat プロジェクトがあることを確認:

```bash
# プロジェクトディレクトリ構造の例
your-project/
├── contracts/
│   └── MyContract.sol
├── hardhat.config.js
├── package.json
└── test/
    └── MyContract.test.js
```

### 1-2. コントラクトのコンパイル確認

```bash
# コントラクトがコンパイルできることを確認
npx hardhat compile
```

成功したら次へ進みます。

## ステップ2: ZeroKeyCI ワークフローの追加

### 2-1. ワークフローファイルの作成

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy with ZeroKeyCI

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  deploy:
    # PRがマージされ、かつ "deploy" ラベルが付いている場合のみ実行
    if: github.event.pull_request.merged == true && contains(github.event.pull_request.labels.*.name, 'deploy')
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: sepolia
      contract-name: MyContract  # あなたのコントラクト名に変更
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

### 2-2. デプロイ設定ファイルの作成

`.zerokey/deploy.yaml` を作成:

```yaml
# デプロイ先ネットワーク
network: sepolia

# デプロイするコントラクト名
contract: MyContract

# コンストラクタ引数（必要に応じて変更）
constructorArgs: []

# デプロイ時に送信するETH（Wei単位）
value: "0"

# Gas設定
gasLimit: 5000000

# Safeの設定
signers:
  threshold: 2  # 必要な署名数
  addresses:
    - "0xYourSafeOwner1Address"  # 実際のアドレスに変更
    - "0xYourSafeOwner2Address"
    - "0xYourSafeOwner3Address"

# メタデータ
metadata:
  description: "Deploy MyContract to Sepolia"
  requestor: "Development Team"

# バリデーション
validations:
  requireTests: true
  minCoverage: 80
```

### 2-3. OPAポリシーの作成（オプション）

`.zerokey/policy.rego` を作成:

```rego
package deployment

# デプロイを許可する条件
allow {
  valid_network
  valid_signers
  tests_passed
}

# 許可されたネットワーク
valid_network {
  input.network == "sepolia"
}

# 署名者の検証
valid_signers {
  count(input.signers.addresses) >= 3
  input.signers.threshold >= 2
}

# テストが通過していること
tests_passed {
  input.validations.requireTests == true
}

# 拒否理由
deny[msg] {
  not valid_network
  msg := "Network not allowed. Use sepolia for testing."
}

deny[msg] {
  not tests_passed
  msg := "Tests must pass before deployment"
}
```

## ステップ3: GitHub Secretsの設定

### 3-1. RPC URLの設定

```bash
# GitHub CLIを使用（推奨）
gh secret set SEPOLIA_RPC_URL --body "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"

# または、GitHubウェブUI経由:
# Settings → Secrets and variables → Actions → New repository secret
```

### 3-2. Safe アドレスの設定（Public Variable）

```bash
# Safe アドレスは公開情報なのでVariableとして設定
gh variable set SAFE_ADDRESS --body "0xYourSafeAddressHere"

# または、GitHubウェブUI経由:
# Settings → Secrets and variables → Actions → Variables → New repository variable
```

**重要:**
- ❌ **絶対に秘密鍵をGitHub Secretsに保存しないでください**
- ✅ Safe アドレスと RPC URL のみを設定

## ステップ4: 初めてのデプロイ

### 4-1. コントラクトの修正

```bash
# 新しいブランチを作成
git checkout -b feat/my-first-deploy

# コントラクトを編集
# contracts/MyContract.sol を修正
```

### 4-2. テストの実行

```bash
# テストを実行
npx hardhat test

# カバレッジを確認（オプション）
npx hardhat coverage
```

### 4-3. Pull Requestの作成

```bash
# 変更をコミット
git add .
git commit -m "feat: update MyContract for first deployment"

# プッシュ
git push origin feat/my-first-deploy

# PRを作成
gh pr create --title "Deploy MyContract to Sepolia" \
  --body "First deployment using ZeroKeyCI"
```

### 4-4. コードレビューとマージ

1. チームメンバーにコードレビューを依頼
2. テストが全て通過することを確認
3. PR を承認してマージ

### 4-5. デプロイラベルの追加

```bash
# マージ後、PRに "deploy" ラベルを追加
gh pr edit <PR番号> --add-label deploy
```

**重要:** ラベルを追加すると、GitHub Actions ワークフローが自動的に起動します！

## ステップ5: Safe Transaction Proposalの確認

### 5-1. GitHub Actionsの確認

```bash
# ワークフロー実行を確認
gh run list --limit 5

# 詳細を確認
gh run view <RUN_ID>
```

### 5-2. Proposalの取得

ワークフローが成功すると:

1. **GitHub Actions Artifacts**に Proposal JSON が保存される
2. **PRコメント**に Proposal 詳細が投稿される

Artifact をダウンロード:

```bash
# ブラウザでダウンロード、または:
gh run download <RUN_ID>
```

### 5-3. Proposal内容の確認

`safe-proposal.json` を確認:

```json
{
  "to": "0xContractAddress",
  "value": "0",
  "data": "0x608060405...",
  "operation": 0,
  "safeTxGas": "5000000",
  "baseGas": "0",
  "gasPrice": "20000000000",
  "gasToken": "0x0000000000000000000000000000000000000000",
  "refundReceiver": "0x0000000000000000000000000000000000000000",
  "nonce": 0
}
```

**確認ポイント:**
- ✅ `to`: デプロイ先アドレス
- ✅ `data`: コントラクトのバイトコード
- ✅ `safeTxGas`: Gas 制限

## ステップ6: Safe Ownersによる署名

### 6-1. Safe UIでProposalをインポート

1. https://app.safe.global にアクセス
2. あなたの Safe を選択
3. 「New Transaction」→「Transaction Builder」を選択
4. Proposal JSON の内容を入力:
   - `to` アドレス
   - `value` (通常は 0)
   - `data` (バイトコード)

### 6-2. 署名の収集

**Owner 1:**
```
1. Safe UIでトランザクションを確認
2. 「Confirm」をクリック
3. MetaMask/ハードウェアウォレットで署名
```

**Owner 2:**
```
1. Safe UIで同じトランザクションを開く
2. 内容を確認（バイトコード、パラメータ等）
3. 「Confirm」をクリック
4. 署名
```

**閾値に達したら:**
- 「Execute」ボタンが有効になる
- 最後の Owner が「Execute」をクリック
- トランザクションがブロックチェインにブロードキャスト

### 6-3. デプロイの確認

```bash
# Etherscanで確認
# https://sepolia.etherscan.io/address/0xYourDeployedContractAddress

# または、Hardhatコンソールで確認
npx hardhat console --network sepolia

> const MyContract = await ethers.getContractFactory("MyContract");
> const contract = MyContract.attach("0xYourDeployedContractAddress");
> await contract.someFunction();
```

## ステップ7: コントラクトの検証（オプション）

### 7-1. Etherscanで検証

```bash
npx hardhat verify --network sepolia 0xYourDeployedContractAddress
```

### 7-2. Blockscoutで検証（ZeroKeyCI統合機能）

`.github/workflows/deploy.yml` に追加:

```yaml
jobs:
  deploy:
    uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
    with:
      safe-address: ${{ vars.SAFE_ADDRESS }}
      network: sepolia
      contract-name: MyContract
      verify-blockscout: true  # 追加
    secrets:
      rpc-url: ${{ secrets.SEPOLIA_RPC_URL }}
```

## トラブルシューティング

### Q1: ワークフローが起動しない

**確認事項:**
1. PR が `main` ブランチにマージされているか
2. `deploy` ラベルが付いているか
3. GitHub Actions が有効か（Settings → Actions）

**解決方法:**
```bash
# ワークフローの状態を確認
gh workflow list
gh workflow view "Deploy with ZeroKeyCI"
```

### Q2: "Invalid Safe address" エラー

**原因:** SAFE_ADDRESS が正しく設定されていない

**解決方法:**
```bash
# 現在の設定を確認
gh variable list

# 正しいアドレスで再設定
gh variable set SAFE_ADDRESS --body "0x1234567890123456789012345678901234567890"
```

### Q3: "Contract compilation failed" エラー

**原因:** コントラクトがコンパイルできない

**解決方法:**
```bash
# ローカルでコンパイルを確認
npx hardhat compile

# エラーメッセージを確認して修正
# 依存関係を確認
npm install
```

### Q4: Safe UIでProposalが見つからない

**原因:** Proposal がまだ作成されていない、または異なるネットワーク

**解決方法:**
1. GitHub Actions logs で Proposal 作成を確認
2. Safe UI で正しいネットワーク（Sepolia）を選択
3. Artifact から手動で Proposal をインポート

### Q5: テストが失敗する

**原因:** バリデーション設定で `requireTests: true`

**解決方法:**
```bash
# テストを修正
npx hardhat test

# カバレッジを確認
npx hardhat coverage

# 全て通過したらコミット＆プッシュ
```

## 次のステップ

### 本番環境へのデプロイ

1. **本番用Safeの作成:**
   ```
   - Mainnetで新しいSafeを作成
   - 3-of-5 または 5-of-7 マルチシグを推奨
   - ハードウェアウォレット（Ledger/Trezor）を使用
   ```

2. **セキュリティ監査:**
   ```
   - 外部監査を実施
   - Slither、Mythrilで自動チェック
   - OPAポリシーで本番環境用のルールを追加
   ```

3. **本番用ワークフローの作成:**
   ```yaml
   # .github/workflows/deploy-mainnet.yml
   jobs:
     deploy-mainnet:
       uses: susumutomita/ZeroKeyCI/.github/workflows/reusable-deploy.yml@main
       with:
         safe-address: ${{ vars.MAINNET_SAFE_ADDRESS }}
         network: mainnet
         contract-name: MyContract
         verify-blockscout: true
       secrets:
         rpc-url: ${{ secrets.MAINNET_RPC_URL }}
   ```

### 高度な機能

- **Envio統合**: リアルタイムイベント監視
- **Lit Protocol**: ポリシーベースの自動署名
- **マルチネットワークデプロイ**: Polygon、Arbitrum、Optimism 対応

詳細は公式ドキュメントを参照:
- [統合ガイド](./INTEGRATION_GUIDE.md)
- [デプロイメントガイド](./DEPLOYMENT.md)
- [セキュリティアーキテクチャ](./SECURITY.md)

## サポート

- **GitHub Issues**: https://github.com/susumutomita/ZeroKeyCI/issues
- **ディスカッション**: https://github.com/susumutomita/ZeroKeyCI/discussions
- **ドキュメント**: https://github.com/susumutomita/ZeroKeyCI/tree/main/docs

---

**重要なセキュリティノート:**

- ❌ **絶対に秘密鍵をGitHub Secretsに保存しないでください**
- ❌ **`.env` ファイルをコミットしないでください**
- ✅ Gnosis Safe マルチシグを使用
- ✅ ハードウェアウォレットを使用
- ✅ 定期的に Safe owners をローテーション

ZeroKeyCI を使えば、セキュリティを犠牲にすることなく、CI/CD の自動化を実現できます！
