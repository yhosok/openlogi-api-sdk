# 出荷(shipments)API 未実装エンドポイントの実装計画

**作成日**: 2025-10-13
**ステータス**: 承認済み

## 📋 調査結果: 未実装エンドポイント

現在の実装と OpenLogi API ドキュメントを照らし合わせた結果、以下のエンドポイントが**未実装**であることを確認しました:

### 1. 倉庫移動(Warehouse Transfer)関連 API (4つ)

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/shipments/transfer` | POST | 倉庫移動作成 |
| `/shipments/transfer/{id}` | PUT | 倉庫移動更新 |
| `/shipments/transfer/{id}/modify` | POST | 倉庫移動修正リクエスト |
| `/shipments/transfer/{id}/cancel` | POST | 倉庫移動キャンセルリクエスト |

### 2. identifier指定の出荷API (6つ)

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/shipments/{account_id}` | GET | identifier指定での出荷依頼一覧取得 |
| `/shipments/{account_id}/{identifier}` | GET | identifier指定での出荷依頼取得 |
| `/shipments/{account_id}/{identifier}` | PUT | identifier指定での出荷依頼修正 |
| `/shipments/{account_id}/{identifier}` | DELETE | identifier指定での出荷依頼削除 |
| `/shipments/{account_id}/{identifier}/modify` | POST | identifier指定での修正リクエスト |
| `/shipments/{account_id}/{identifier}/cancel` | POST | identifier指定でのキャンセルリクエスト |

**合計: 10個の未実装エンドポイント**

## 🎯 実装方針

### TDDアプローチ (Red-Green-Refactor)

1. **Red**: テストを先に書いて失敗させる
2. **Green**: 最小限の実装でテストをパスさせる
3. **Refactor**: コードをリファクタリング

### 優先順位

#### Phase 1: 倉庫移動API (高優先度)
- 新しい機能領域のため、まず型定義とAPIを実装
- 倉庫間の商品移動という独立した機能

#### Phase 2: identifier指定API (中優先度)
- 既存のID指定APIの代替手段として実装
- アカウントIDとidentifierによる柔軟な操作を提供

## 📝 詳細実装計画

### Phase 1: 倉庫移動(Transfer) API実装

#### Step 1: 型定義の追加 (`src/types/shipments.ts`)

以下の型定義を追加:

```typescript
// 移動先倉庫情報
TransferDestinationSchema = z.object({
  warehouse: z.string() // 移動先倉庫コード
})

// 移動商品情報
TransferItemSchema = z.object({
  code: z.string(),        // 商品コード
  quantity: z.number(),    // 数量
  name: z.string().optional() // 商品名(オプショナル)
})

// 倉庫移動作成リクエスト
CreateTransferRequestSchema = z.object({
  warehouse: z.string(),              // 移動元倉庫コード
  destination: TransferDestinationSchema, // 移動先倉庫情報
  items: z.array(TransferItemSchema)   // 移動商品リスト
})

// 倉庫移動更新リクエスト
UpdateTransferRequestSchema = z.object({
  destination: TransferDestinationSchema,
  items: z.array(TransferItemSchema)
})

// 倉庫移動修正リクエスト
ModifyTransferRequestSchema = z.object({
  destination: TransferDestinationSchema
})

// 倉庫移動レスポンス (ShipmentResponseを拡張)
TransferResponseSchema = ShipmentResponseSchema.extend({
  destination: z.object({
    warehouse: z.string(),
    warehousing: z.object({
      id: z.string()
    }).optional()
  }).optional()
})
```

#### Step 2: API関数の実装 (`src/resources/shipments.ts`)

以下の4つの関数を実装:

1. **createTransfer()**
```typescript
export async function createTransfer(
  client: OpenLogiClient,
  data: CreateTransferRequest
): Promise<TransferResponse>
```

2. **updateTransfer()**
```typescript
export async function updateTransfer(
  client: OpenLogiClient,
  id: string,
  data: UpdateTransferRequest
): Promise<TransferResponse>
```

3. **modifyTransfer()**
```typescript
export async function modifyTransfer(
  client: OpenLogiClient,
  id: string,
  data: ModifyTransferRequest
): Promise<TransferResponse>
```

4. **cancelTransfer()**
```typescript
export async function cancelTransfer(
  client: OpenLogiClient,
  id: string
): Promise<TransferResponse>
```

#### Step 3: テストの実装 (`tests/resources/shipments.test.ts`)

各API関数に対して以下のテストを追加:
- 正常系テスト (成功パターン)
- 異常系テスト (バリデーションエラー、404エラー等)

#### Step 4: MSWモックハンドラーの追加 (`tests/setup.ts`)

以下のモックハンドラーを追加:
- `POST /shipments/transfer`
- `PUT /shipments/transfer/:id`
- `POST /shipments/transfer/:id/modify`
- `POST /shipments/transfer/:id/cancel`

#### Step 5: エクスポートの追加 (`src/index.ts`)

新しい型と関数を公開APIとしてエクスポート

### Phase 2: identifier指定API実装

#### Step 1: 型定義の追加 (`src/types/shipments.ts`)

```typescript
// identifier指定の一覧取得クエリ
ListShipmentsByIdentifierQuerySchema = z.object({
  identifier: z.string() // カンマ区切りで最大100件
})

// 既存のUpdateShipmentRequestSchemaなどを再利用
```

#### Step 2: API関数の実装 (`src/resources/shipments.ts`)

以下の6つの関数を実装:

1. **listShipmentsByAccountId()**
```typescript
export async function listShipmentsByAccountId(
  client: OpenLogiClient,
  accountId: string,
  query: ListShipmentsByIdentifierQuery
): Promise<ListShipmentsResponse>
```

2. **getShipmentByAccountId()**
```typescript
export async function getShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string
): Promise<ShipmentResponse>
```

3. **updateShipmentByAccountId()**
```typescript
export async function updateShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
  data: UpdateShipmentRequest
): Promise<ShipmentResponse>
```

4. **deleteShipmentByAccountId()**
```typescript
export async function deleteShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string
): Promise<void>
```

5. **modifyShipmentByAccountId()**
```typescript
export async function modifyShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
  data: ShipmentModifyRequest
): Promise<ShipmentResponse>
```

6. **cancelShipmentByAccountId()**
```typescript
export async function cancelShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string
): Promise<ShipmentResponse>
```

#### Step 3: テストの実装

各API関数に対して包括的なテストケースを追加

#### Step 4: MSWモックハンドラーの追加

以下のモックハンドラーを追加:
- `GET /shipments/:account_id`
- `GET /shipments/:account_id/:identifier`
- `PUT /shipments/:account_id/:identifier`
- `DELETE /shipments/:account_id/:identifier`
- `POST /shipments/:account_id/:identifier/modify`
- `POST /shipments/:account_id/:identifier/cancel`

#### Step 5: エクスポートの追加

新しい関数を公開APIとしてエクスポート

## 🔧 技術的考慮事項

### 1. Zodスキーマによるバリデーション
- すべてのリクエスト/レスポンスでZodを使用
- 実行時の型安全性を保証

### 2. エラーハンドリング
- 既存のエラークラス体系を活用
  - `ValidationError`
  - `NotFoundError`
  - `ApiError`

### 3. 型安全性
- TypeScriptの型推論を最大限活用
- `z.infer<>`でスキーマから型を自動生成

### 4. コード一貫性
- 既存のコーディングスタイルとパターンを踏襲
- 関数名、パラメータ名の命名規則を統一

### 5. ドキュメント
- JSDocコメントで日本語・英語のドキュメントを追加
- `@example`タグで使用例を提供

## 📦 成果物

| ファイル | 変更内容 |
|---------|---------|
| `src/types/shipments.ts` | 新しい型定義の追加 (Transfer関連、identifier関連) |
| `src/resources/shipments.ts` | 10個の新しいAPI関数の実装 |
| `tests/resources/shipments.test.ts` | 包括的なテストスイートの追加 |
| `tests/setup.ts` | MSWモックハンドラーの追加 (10エンドポイント) |
| `src/index.ts` | 公開APIのエクスポート追加 |

## 🔍 品質保証

### テストカバレッジ
- すべての新規関数に対してユニットテストを実装
- 正常系・異常系の両方をカバー
- MSWを使用した統合テスト

### コード品質チェック
- ESLintによる静的解析
- Prettierによるコードフォーマット
- TypeScriptの型チェック

### 実装完了時のチェックリスト
- [ ] すべてのテストがパス (`npm test`)
- [ ] Lintエラーがゼロ (`npm run lint`)
- [ ] 型チェックがパス (`npm run type-check`)
- [ ] ビルドが成功 (`npm run build`)

## ⚠️ 注意事項

1. **後方互換性は考慮不要** (ユーザー指示による)
2. **API仕様が不明な場合は必ずユーザーに確認**
3. **context7で最新のZod/TypeScript情報を確認しながら実装**
4. **Web検索が必要な場合は `gemini -p` を使用**

## 📅 実装スケジュール

### Phase 1: 倉庫移動API (推定: 2-3時間)
- 型定義: 30分
- 実装: 1時間
- テスト: 1時間
- レビュー・修正: 30分

### Phase 2: identifier指定API (推定: 2-3時間)
- 型定義: 30分
- 実装: 1時間
- テスト: 1時間
- レビュー・修正: 30分

### 最終確認 (推定: 30分)
- 統合テスト
- Lint/型チェック
- ドキュメント確認

**合計推定時間: 5-7時間**

## 🚀 次のステップ

1. ✅ プランの承認 (完了)
2. 🔄 Phase 1の実装開始
3. Phase 1のテスト・レビュー
4. Phase 2の実装開始
5. Phase 2のテスト・レビュー
6. 最終確認・デプロイ準備
