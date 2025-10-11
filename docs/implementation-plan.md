# OPENLOGI API SDK 実装計画

## 収集した情報

### API仕様（OPENLOGI API v1.5）
- **ベースURL**: `https://api.openlogi.com/api`（本番）/ `http://localhost:8080`（デフォルト）
- **認証**: `Authorization: Bearer <token>`
- **バージョン指定**: `X-Api-Version: 1.5`ヘッダー必須
- **レートリミット**: 60リクエスト/分

### 主要エンドポイント
1. **items（商品）**: 一覧、登録、一括登録、取得、更新、削除、画像管理
   - `GET /items` - 商品一覧
   - `POST /items` - 商品登録
   - `POST /items/bulk` - 商品一括登録
   - `GET /items/{id}` - 商品情報取得
   - `PUT /items/{id}` - 商品情報更新
   - `DELETE /items/{id}` - 商品削除
   - `POST /items/{id}/images` - 商品画像登録
   - `DELETE /items/{id}/images/{image_id}` - 商品画像削除
   - `GET /items/{account_id}` - 商品一覧（code指定）
   - `GET /items/{account_id}/{code}` - 商品情報取得（code指定）
   - `PUT /items/{account_id}/{code}` - 商品更新（code指定）
   - `DELETE /items/{account_id}/{code}` - 商品削除（code指定）

2. **warehousings（入荷）**: 一覧、作成、取得、更新、削除、実績照会、ラベル取得
   - `GET /warehousings` - 入荷依頼一覧
   - `POST /warehousings` - 入荷依頼作成
   - `GET /warehousings/{id}` - 入荷依頼情報
   - `PUT /warehousings/{id}` - 入荷依頼更新
   - `DELETE /warehousings/{id}` - 入荷依頼削除
   - `GET /warehousings/stocked` - 直近の入荷実績
   - `GET /warehousings/stocked/{year}/{month}/{day}` - 指定年月日の入荷実績
   - `GET /warehousings/{id}.pdf` - 入荷ラベル取得

3. **shipments（出荷）**: 一覧、作成、一括作成、取得、更新、削除、修正、キャンセル
   - `GET /shipments` - 出荷依頼一覧
   - `POST /shipments` - 出荷依頼作成
   - `POST /shipments/bulk` - 出荷依頼一括作成
   - `GET /shipments/{id}` - 出荷依頼取得
   - `PUT /shipments/{id}` - 出荷依頼更新
   - `DELETE /shipments/{id}` - 出荷依頼削除
   - `POST /shipments/{id}/modify` - 出荷依頼修正
   - `POST /shipments/{id}/cancel` - 出荷依頼キャンセル

### 技術スタック（2025年ベストプラクティス）
- **ビルドツール**: tsup（esbuild、高速・シンプル）
- **テストフレームワーク**: Vitest（Jest互換、高速）
- **バリデーション**: Zod（型安全＋ランタイム検証）
- **HTTPクライアント**: ky（fetch ベース、軽量）
- **型定義**: TypeScript（strict mode）

## 実装手順

### フェーズ1: プロジェクト初期化
1. package.json作成
   - 依存関係: tsup, vitest, zod, ky, typescript
   - devDependencies: @types/node, eslint, prettier等
2. tsconfig.json設定
   - strict mode有効
   - 最新ESターゲット
3. tsup.config.ts設定
   - ESM/CJS dual build
   - 型定義ファイル生成
   - sourcemap有効
4. vitest.config.ts設定
   - MSWセットアップ
5. ESLint/Prettier設定

### フェーズ2: 型定義・Zodスキーマ作成
1. 共通型定義 (`src/types/common.ts`)
   - ErrorResponse
   - PaginationParams
   - ApiConfig
2. 商品型定義 (`src/types/items.ts`)
   - ItemSchema
   - ItemRequestSchema
   - ItemResponseSchema
3. 入荷型定義 (`src/types/warehousings.ts`)
   - WarehousingSchema
   - WarehousingRequestSchema
   - WarehousingResponseSchema
4. 出荷型定義 (`src/types/shipments.ts`)
   - ShipmentSchema
   - ShipmentRequestSchema
   - ShipmentResponseSchema

### フェーズ3: コアクライアント実装
1. `src/client.ts`: Baseクライアント
   - kyのラッパー実装
   - 認証ヘッダー自動付与
   - API Versionヘッダー設定
   - baseURL設定（デフォルト: http://localhost:8080）
   - エラーハンドリング
   - Zodでレスポンス検証
   - リトライ設定

### フェーズ4: リソースAPI実装（関数型スタイル）
1. 商品API (`src/resources/items.ts`)
   - listItems
   - createItem
   - bulkCreateItems
   - getItem
   - updateItem
   - deleteItem
   - uploadItemImage
   - deleteItemImage
2. 入荷API (`src/resources/warehousings.ts`)
   - listWarehousing
   - createWarehousing
   - getWarehousing
   - updateWarehousing
   - deleteWarehousing
   - getStockedWarehousing
   - getStockedWarehousingByDate
   - getWarehousingLabel
3. 出荷API (`src/resources/shipments.ts`)
   - listShipments
   - createShipment
   - bulkCreateShipments
   - getShipment
   - updateShipment
   - deleteShipment
   - modifyShipment
   - cancelShipment

### フェーズ5: エラーハンドリング
1. `src/errors.ts`: カスタムエラークラス
   - OpenLogiError（基底クラス）
   - ApiError
   - AuthenticationError
   - ValidationError
   - RateLimitError
   - NotFoundError

### フェーズ6: テスト実装（TDD）
1. MSWセットアップ (`tests/setup.ts`)
2. 商品APIテスト (`tests/resources/items.test.ts`)
3. 入荷APIテスト (`tests/resources/warehousings.test.ts`)
4. 出荷APIテスト (`tests/resources/shipments.test.ts`)
5. エラーハンドリングテスト
6. クライアントテスト

### フェーズ7: ビルド・ドキュメント
1. ESM/CJS両対応確認
2. 型定義ファイル生成確認
3. README作成
4. API使用例作成

## ディレクトリ構造
```
openlogi-api-sdk/
├── docs/
│   └── implementation-plan.md
├── src/
│   ├── client.ts              # コアクライアント
│   ├── resources/
│   │   ├── items.ts           # 商品API
│   │   ├── warehousings.ts    # 入荷API
│   │   └── shipments.ts       # 出荷API
│   ├── types/
│   │   ├── items.ts           # 商品型定義
│   │   ├── warehousings.ts    # 入荷型定義
│   │   ├── shipments.ts       # 出荷型定義
│   │   └── common.ts          # 共通型定義
│   ├── errors.ts              # エラークラス
│   └── index.ts               # エントリポイント
├── tests/
│   ├── resources/
│   │   ├── items.test.ts
│   │   ├── warehousings.test.ts
│   │   └── shipments.test.ts
│   └── setup.ts               # MSW設定
├── dist/                      # ビルド出力
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.json
└── .prettierrc.json
```

## 実装方針
- **型安全性最優先**（any型禁止）
- **関数型スタイル**（副作用の最小化、純粋関数）
- **TDD**（Red-Green-Refactor サイクル）
- **後方互換性は考慮しない**
- **Context7で最新情報を随時確認**
- **Zodによるランタイム検証**で堅牢性を確保
- **明確な型制約**により利用者が迷わないAPI設計

## API使用例（想定）
```typescript
import { createClient, listItems, createItem } from 'openlogi-api-sdk';

// クライアント初期化
const client = createClient({
  apiToken: 'your-api-token',
  baseUrl: 'http://localhost:8080', // デフォルト
});

// 商品一覧取得
const items = await listItems(client, { id: 'TS001-I000001' });

// 商品作成
const newItem = await createItem(client, {
  code: 'ITEM-001',
  name: '商品名',
  price: 1000,
});
```

## チェックリスト
- [ ] すべてのテストが通る
- [ ] ESLintエラーがない
- [ ] 型定義ファイルが正しく生成される
- [ ] ESM/CJS両方でビルドできる
- [ ] README作成完了
