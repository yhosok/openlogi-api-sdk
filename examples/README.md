# OpenLogi API SDK - サンプルコード集

このディレクトリには、OpenLogi API SDKの使用方法を示すサンプルコードが含まれています。

## 📁 サンプル一覧

### 1. `basic-usage.ts` - 基本的な使い方
SDKの基本的な機能を学ぶためのサンプルです。

**含まれる機能:**
- ✅ クライアントの初期化と設定
- ✅ 商品の一覧取得（ページネーション、ソート）
- ✅ 商品の詳細取得
- ✅ 新しい商品の作成

**対象者:** SDKを初めて使う方

### 2. `complete-workflow.ts` - 完全なワークフロー
実際の業務フローを想定した完全なサンプルです。

**含まれる機能:**
- ✅ 商品の登録
- ✅ 入庫（warehousing）の作成と確認
- ✅ 出庫（shipment）の作成と確認
- ✅ ステータスの追跡

**対象者:** 実際のシステム統合を考えている方

### 3. `error-handling.ts` - エラーハンドリング
適切なエラーハンドリングの方法を示すサンプルです。

**含まれる機能:**
- ✅ 404エラー（NotFoundError）のハンドリング
- ✅ バリデーションエラーのハンドリング
- ✅ 認証エラーのハンドリング
- ✅ レート制限エラーのハンドリング
- ✅ 包括的なエラーハンドリングパターン

**対象者:** 堅牢なアプリケーションを構築したい方

## 🚀 セットアップ

### 前提条件

- Node.js 18.0.0 以上
- OpenLogi APIのアクセストークン

### 1. SDKと依存パッケージのインストール

プロジェクトディレクトリで以下のコマンドを実行します：

```bash
npm install openlogi-api-sdk dotenv
```

または、このリポジトリをローカルでビルドして使用する場合：

```bash
# SDKのルートディレクトリで
npm install
npm run build

# examples ディレクトリで
npm install  # dotenvも自動的にインストールされます
npm link openlogi-api-sdk
```

### 2. 環境変数の設定（重要）

**サンプルを実行する前に、必ずAPIトークンを設定してください。**

#### 方法1: 環境変数で設定（推奨）

```bash
export OPENLOGI_API_TOKEN="あなたの実際のAPIトークン"
```

#### 方法2: .envファイルで設定

`examples`ディレクトリに`.env`ファイルを作成：

```bash
cd examples
echo "OPENLOGI_API_TOKEN=あなたの実際のAPIトークン" > .env
```

**注意:** 環境変数が設定されていない場合、以下のエラーが表示されます：
```
❌ エラー: OPENLOGI_API_TOKEN 環境変数が設定されていません
```

### 3. TypeScriptの設定

`examples`ディレクトリに`package.json`を作成：

```json
{
  "name": "openlogi-sdk-examples",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "basic": "tsx basic-usage.ts",
    "workflow": "tsx complete-workflow.ts",
    "errors": "tsx error-handling.ts"
  },
  "dependencies": {
    "openlogi-api-sdk": "*"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 📖 サンプルの実行方法

### 方法1: tsx を使用（推奨）

```bash
# 基本的な使い方
npx tsx basic-usage.ts

# 完全なワークフロー
npx tsx complete-workflow.ts

# エラーハンドリング
npx tsx error-handling.ts
```

### 方法2: TypeScriptコンパイル後に実行

```bash
# TypeScriptをJavaScriptにコンパイル
npx tsc basic-usage.ts --module esnext --target es2020 --moduleResolution node

# コンパイル済みファイルを実行
node basic-usage.js
```

### 方法3: ts-node を使用

```bash
npx ts-node --esm basic-usage.ts
```

## 💡 使用上のヒント

### APIトークンの取得

OpenLogi APIのアクセストークンは、OpenLogiの管理画面から取得できます：

1. OpenLogiにログイン
2. 設定 > API設定 に移動
3. 新しいトークンを生成
4. トークンを安全に保管

### 本番環境での使用

本番環境では、以下の点に注意してください：

```typescript
const client = createClient({
  apiToken: process.env.OPENLOGI_API_TOKEN, // 環境変数から取得
  baseUrl: 'https://api.openlogi.com', // 本番環境のURL
  timeout: 30000, // タイムアウト設定
  retry: {
    limit: 3, // リトライ回数を増やす
  },
})
```

### デバッグ

APIリクエスト/レスポンスをデバッグする場合：

```typescript
try {
  const result = await listItems(client, query)
  console.log('Success:', result)
} catch (error) {
  console.error('Error details:', error)
  if (error instanceof ValidationError && error.zodError) {
    console.error('Validation errors:', error.zodError.errors)
  }
}
```

## 🔗 関連リンク

- [OpenLogi API ドキュメント](https://docs.openlogi.com)
- [SDK リポジトリ](https://github.com/your-org/openlogi-api-sdk)
- [問題報告](https://github.com/your-org/openlogi-api-sdk/issues)

## 📝 ライセンス

MIT License
