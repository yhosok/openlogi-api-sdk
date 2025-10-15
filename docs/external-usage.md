# 外部プロジェクトからSDKを使用する方法

このドキュメントでは、openlogi-api-sdkを別のプロジェクトから使用する方法を説明します。

## 方法1: npm link（開発中・推奨）

開発中のSDKをローカルでテストする場合に最適です。

### 手順

```bash
# 1. SDKプロジェクトでビルド & リンク
cd /Users/yhosok/study/openlogi-api-sdk
npm run build
npm link

# 2. 別のプロジェクトでリンクを使用
cd /path/to/your-project
npm link openlogi-api-sdk
```

### 使用例

```typescript
// your-project/src/index.ts
import { createClient, listItems } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: process.env.OPENLOGI_API_TOKEN!,
  baseUrl: 'https://api.openlogi.com',
})

const items = await listItems(client, { page: 1, per_page: 10 })
console.log(items)
```

### リンク解除

```bash
cd /path/to/your-project
npm unlink openlogi-api-sdk

# SDKプロジェクト側でもリンク解除
cd /Users/yhosok/study/openlogi-api-sdk
npm unlink
```

### メリット・デメリット

✅ **メリット:**
- SDKの変更がリアルタイムに反映される（`npm run build`後）
- 開発中のテストに最適
- 無料

❌ **デメリット:**
- 開発環境限定（本番環境には不適切）
- SDKを変更するたびにビルドが必要

---

## 方法2: ローカルパス指定

package.jsonでローカルのSDKパスを直接指定します。

### 手順

```bash
cd /path/to/your-project

# ローカルパスを指定してインストール
npm install /Users/yhosok/study/openlogi-api-sdk
```

または、`package.json`に直接記述：

```json
{
  "dependencies": {
    "openlogi-api-sdk": "file:../openlogi-api-sdk"
  }
}
```

その後：

```bash
npm install
```

### メリット・デメリット

✅ **メリット:**
- シンプル
- 相対パスも使用可能
- チーム内でモノレポ構成に便利

❌ **デメリット:**
- パスが環境依存になる
- CI/CDでの取り扱いが面倒
- npm installのたびにコピーが作成される

---

## 方法3: GitHubリポジトリから直接インストール

SDKをGitHubにプッシュしている場合に使用できます。

### 手順

```bash
cd /path/to/your-project

# GitHubリポジトリから直接インストール
npm install git+https://github.com/your-username/openlogi-api-sdk.git

# 特定のブランチ・タグを指定
npm install git+https://github.com/your-username/openlogi-api-sdk.git#v0.1.0
npm install git+https://github.com/your-username/openlogi-api-sdk.git#develop
```

または、`package.json`に記述：

```json
{
  "dependencies": {
    "openlogi-api-sdk": "git+https://github.com/your-username/openlogi-api-sdk.git#v0.1.0"
  }
}
```

### メリット・デメリット

✅ **メリット:**
- npm公開前でも使用可能
- バージョン管理が容易（タグ・ブランチ指定）
- CI/CDと相性が良い

❌ **デメリット:**
- GitHubアクセスが必要
- プライベートリポジトリの場合は認証設定が必要

---

## 方法4: npm公開（本番環境・推奨）

npmレジストリに公開する方法です。最も一般的で推奨される方法です。

### 事前準備

```bash
# npmアカウントでログイン
npm login

# パッケージ名が使用可能か確認
npm search openlogi-api-sdk
```

### package.jsonの確認

公開前に`package.json`を確認：

```json
{
  "name": "openlogi-api-sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for OpenLogi API",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### 公開手順

```bash
cd /Users/yhosok/study/openlogi-api-sdk

# 1. ビルド
npm run build

# 2. バージョン確認・更新
npm version patch  # 0.1.0 → 0.1.1
# または
npm version minor  # 0.1.0 → 0.2.0
# または
npm version major  # 0.1.0 → 1.0.0

# 3. 公開（初回）
npm publish --access public

# 4. 公開（2回目以降）
npm publish
```

### 外部プロジェクトでの使用

```bash
cd /path/to/your-project
npm install openlogi-api-sdk
```

### メリット・デメリット

✅ **メリット:**
- 本番環境に最適
- バージョン管理が容易
- 依存関係の解決が自動
- 他の開発者も簡単に利用可能

❌ **デメリット:**
- パッケージ名の衝突に注意
- 公開後の削除は制限される
- npmアカウントが必要

---

## 方法5: プライベートnpmレジストリ

企業内など、非公開で管理したい場合に使用します。

### オプション

1. **npm private packages**（有料）
2. **GitHub Packages**（無料・推奨）
3. **Verdaccio**（セルフホスト）
4. **Artifactory / Nexus**（エンタープライズ向け）

### GitHub Packagesの例

#### 1. `.npmrc`ファイルを作成

```bash
# SDKプロジェクトに.npmrcを作成
echo "@your-username:registry=https://npm.pkg.github.com" > .npmrc
```

#### 2. package.jsonを更新

```json
{
  "name": "@your-username/openlogi-api-sdk",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

#### 3. 認証設定

```bash
# GitHubトークンで認証
npm login --registry=https://npm.pkg.github.com
```

#### 4. 公開

```bash
npm publish
```

#### 5. 外部プロジェクトで使用

```bash
# プロジェクトに.npmrcを作成
echo "@your-username:registry=https://npm.pkg.github.com" > .npmrc

# インストール
npm install @your-username/openlogi-api-sdk
```

---

## 推奨される使い分け

| シーン | 推奨方法 | 理由 |
|--------|----------|------|
| **開発中のテスト** | npm link | リアルタイムで変更を反映できる |
| **モノレポ構成** | ローカルパス | シンプルで管理しやすい |
| **チーム内共有（非公開）** | GitHub Packages | 無料で認証・バージョン管理が可能 |
| **オープンソース公開** | npm公開 | 最も標準的で使いやすい |
| **企業内限定配布** | プライベートレジストリ | セキュリティとガバナンス |

---

## 実践例: 新規プロジェクトでSDKを使う

### 1. プロジェクトのセットアップ

```bash
# 新規プロジェクト作成
mkdir my-openlogi-app
cd my-openlogi-app
npm init -y

# TypeScript環境をセットアップ
npm install -D typescript @types/node tsx
npx tsc --init
```

### 2. SDKをインストール（開発中の場合）

```bash
# 開発中のSDKをリンク
cd /Users/yhosok/study/openlogi-api-sdk
npm run build
npm link

cd /path/to/my-openlogi-app
npm link openlogi-api-sdk
```

### 3. 環境変数を設定

```bash
# .envファイルを作成
cat > .env << EOF
OPENLOGI_API_TOKEN=your-api-token-here
EOF

# dotenvをインストール
npm install dotenv
```

### 4. サンプルコードを作成

```typescript
// src/index.ts
import 'dotenv/config'
import { createClient, listItems } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: process.env.OPENLOGI_API_TOKEN!,
  baseUrl: 'https://api.openlogi.com',
})

async function main() {
  const items = await listItems(client, {
    page: 1,
    per_page: 10,
  })

  console.log(`取得した商品数: ${items.data.length}`)
  items.data.forEach((item) => {
    console.log(`- ${item.item_name} (${item.item_code})`)
  })
}

main().catch(console.error)
```

### 5. package.jsonにスクリプトを追加

```json
{
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  }
}
```

### 6. 実行

```bash
npm start
```

---

## トラブルシューティング

### Q1: "Cannot find module 'openlogi-api-sdk'"

**原因:** SDKがビルドされていない、またはリンクが正しく設定されていない

**解決策:**
```bash
# SDKプロジェクトでビルド
cd /Users/yhosok/study/openlogi-api-sdk
npm run build

# リンクを再設定
npm link
cd /path/to/your-project
npm link openlogi-api-sdk
```

### Q2: 型定義が見つからない

**原因:** `dist`ディレクトリに`.d.ts`ファイルが生成されていない

**解決策:**
```bash
# SDKプロジェクトでビルドを確認
npm run build
ls -la dist/  # index.d.ts が存在するか確認
```

### Q3: ESM/CommonJSの互換性エラー

**原因:** モジュールシステムの不一致

**解決策:**
- ESMを使用する場合: `package.json`に`"type": "module"`を追加
- CommonJSを使用する場合: `require()`を使用

```typescript
// ESM
import { createClient } from 'openlogi-api-sdk'

// CommonJS
const { createClient } = require('openlogi-api-sdk')
```

---

## まとめ

開発段階では **npm link** を使用し、本番環境や配布時には **npm公開** または **GitHub Packages** を使用するのが一般的です。

チーム内での開発フローに合わせて適切な方法を選択してください。
