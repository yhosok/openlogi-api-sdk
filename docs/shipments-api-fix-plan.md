# 出庫(shipments) API 修正プラン

## 概要

OpenLogi API公式ドキュメント（https://api.openlogi.com/doc/api.html）と現在の実装を比較した結果、多数の相違点が発見されました。本ドキュメントでは、発見された相違点と修正計画を記載します。

## 発見された主な相違点

### 1. フィールド名の変更

| 現在の実装 | 公式ドキュメント | 備考 |
|-----------|----------------|------|
| `delivery_info` | `recipient` | 受取人情報のフィールド名変更 |
| `delivery_time_zone` | `delivery_time_slot` | 配送時間帯フィールド名変更、値の形式も変更 |

### 2. 新規トップレベルフィールド（約40個以上）

#### 送り主・受取人情報

- `sender` (object) - 送り主情報
  - `postcode` (string)
  - `prefecture` (string)
  - `address1` (string)
  - `address2` (string)
  - `name` (string)
  - `company` (string)
  - `division` (string)
  - `phone` (string)

- `recipient` (object) - 受取人情報（現在のdelivery_infoと類似構造）
  - `postcode` (string)
  - `prefecture` (string)
  - `address1` (string)
  - `address2` (string)
  - `name` (string)
  - `company` (string)
  - `division` (string)
  - `phone` (string)

#### 配送関連

- `delivery_carrier` (enum: "YAMATO" | "SAGAWA")
- `delivery_time_slot` (enum: "AM" | "12" | "14" | "16" | "18" | "19")
- `delivery_day` (date string)
- `delivery_method` (enum: "POST_EXPRESS" | "HOME_BOX")
- `delivery_options` (object)
  - `box_delivery` (boolean)
  - `fragile_item` (boolean)
- `delivery_service` (enum: 多数の国際配送サービスコード)
  - SAGAWA-HIKYAKU-YU-PACKET
  - SAGAWA-TAKUHAIBIN
  - SAGAWA-COOLBIN
  - YAMATO-NEKOPOSU
  - YAMATO-TAKKYUBIN
  - YAMATO-COOLBIN
  - JAPANPOST-EMS
  - JAPANPOST-EPACKET
  - JAPANPOST-YU-PACKET
  - FEDEX-PRIORITY
  - FEDEX-CONNECT-PLUS
  - DHL-EXPRESS

#### 金額・税金

- `cash_on_delivery` (boolean) - 代金引換フラグ
- `total_for_cash_on_delivery` (integer) - 代金引換合計金額
- `tax_for_cash_on_delivery` (integer) - 代金引換税額
- `total_with_normal_tax` (integer) - 合計（通常税率10%）
- `total_with_reduced_tax` (integer) - 合計（軽減税率8%）
- `tax_included` (boolean) - 税込みフラグ
- `tax_number` (string, 2-30文字) - 納税者番号

#### 国際発送

- `international` (boolean) - 海外発送フラグ
- `currency_code` (string) - 通貨コード
- `insurance` (boolean) - 損害保険制度の加入希望
- `purpose` (enum) - 輸出目的
  - "GIFT" - 贈物
  - "DOCUMENTS" - 書類
  - "COMMERCIAL_SAMPLE" - 商品見本
  - "SALE_OF_GOODS" - 販売品
  - "RETURNED_GOODS" - 返送品
  - "OTHERS" - その他
- `duty_paid` (boolean) - 関税支払い済み
- `vat_number` (string) - VAT番号
- `eori_number` (string) - EORI番号
- `letter_of_attorney` (boolean) - 委任状

#### 倉庫・在庫

- `warehouse` (string) - 倉庫コード
- `backorder_if_unavailable` (boolean, default: false) - 在庫不足時の出荷予約フラグ
- `allocate_priority` (integer, 0-100) - 引当優先度
- `apply_rule` (boolean) - 出荷ルール適用フラグ

#### その他

- `assigned_shipping_date` (date string) - 割当出荷日
- `fba_shipment_id` (string) - FBA出荷ID
- `label_note` (string) - 伝票備考
- `bundle_shipping_label` (string) - 同梱配送ラベル

### 3. items配列の新規フィールド

**リクエスト:**
- `price` (integer) - 金額
- `is_reduced_tax` (boolean) - 軽減税率適用商品フラグ
- `backorder_if_unavailable` (boolean) - 商品単位の在庫不足時出荷予約フラグ
- `hs_code` (string) - HSコード
- `gift_wrapping_type` (string) - ギフトラッピングタイプ（商品単位）
- `cushioning_type` (string) - 緩衝材タイプ（商品単位）

**レスポンス:**
- `backordered` (boolean) - バックオーダー状態

### 4. レスポンスの新規フィールド

- `shipment_return` (boolean) - 返品フラグ
- `assigned_temperature_zone` (string) - 割当温度帯
- `shipped_at` (datetime) - 出荷日時
- `tracking_code` (string) - 追跡コード
- `tracking_codes` (array of string) - 追跡コード配列
- `url` (string) - URL
- `package_quantity` (integer) - パッケージ数量
- `packages` (array) - パッケージ情報
- `cases` (object) - ケース情報

### 5. キャンセルAPI

現在の実装は正しい（bodyなし）。ドキュメントでも "REQUEST BODY SCHEMA: any" と記載されている。

## 修正作業の詳細

### ステップ1: types/common.ts の更新

新しいenumを追加:
- `DeliveryCarrierSchema` - 配送業者
- `DeliveryTimeSlotSchema` - 配送時間帯
- `DeliveryMethodSchema` - 配送方法
- `DeliveryServiceSchema` - 配送サービス
- `PurposeSchema` - 輸出目的

### ステップ2: types/shipments.ts の大幅更新

#### 2.1 新しいスキーマの追加

- `SenderInfoSchema` - 送り主情報
- `RecipientInfoSchema` - 受取人情報（現在のDeliveryInfoSchemaから改名・調整）
- `DeliveryOptionsSchema` - 配送オプション

#### 2.2 CreateShipmentRequestSchemaの更新

- フィールド名変更: `delivery_info` → `recipient`
- フィールド名変更: `delivery_time_zone` → `delivery_time_slot`
- 新規フィールド追加（約40個）
- `sender` フィールド追加

#### 2.3 ShipmentItemSchemaの更新

- 新規フィールド追加（price, is_reduced_tax, backorder_if_unavailable, hs_code等）

#### 2.4 ShipmentResponseSchemaの更新

- 全てのリクエストフィールド
- レスポンス専用フィールド追加

### ステップ3: resources/shipments.ts の更新

- 関数シグネチャは変更なし
- 型定義の参照を更新

### ステップ4: tests/setup.ts の更新

- モックハンドラーのレスポンスデータを更新
- 新しいフィールドを含むサンプルデータに変更

### ステップ5: tests/resources/shipments.test.ts の更新

- テストケースのリクエストデータを更新
- 新しいフィールドを使用するテストケースを追加
- アサーションを更新

## 検証項目

1. **型チェック**: `npm run type-check`
2. **Lint**: `npm run lint`
3. **テスト**: `npm test`
4. **ビルド**: `npm run build`

## 推定作業時間

- types/common.ts 更新: 10分
- types/shipments.ts 更新: 30-40分
- tests/setup.ts 更新: 10-15分
- tests/shipments.test.ts 更新: 15-20分
- 検証と修正: 10-15分

**合計: 約75-100分**

## 注意事項

1. **破壊的変更**
   - `delivery_info` → `recipient` の変更は破壊的変更
   - 利用者がいないため、後方互換性は考慮しない

2. **必須/任意の区別**
   - 公式ドキュメントの仕様に従う
   - `identifier` または `order_no` のいずれかが必須
   - `recipient` と `items` は必須

3. **バリデーション**
   - Zodスキーマで全てのフィールドにバリデーションを設定
   - enum値は公式ドキュメントの値を正確に反映

## 参考情報

- 公式ドキュメント: https://api.openlogi.com/doc/api.html
- リクエストサンプルJSON取得済み
- レスポンスサンプルJSON取得済み
