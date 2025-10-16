# OpenLogi API SDK

TypeScript/JavaScriptでOpenLogi APIを利用するための型安全なSDKです。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)

## ⚠️ 警告 / IMPORTANT NOTICE

**このSDKは非公式のものであり、十分なテストがされていません。**

- ⚠️ **非公式SDK**: このSDKはOpenLogiの公式SDKではありません
- ⚠️ **テスト不足**: 本番環境での十分な動作検証が行われていません
- ⚠️ **自己責任**: 使用は完全に自己責任となります
- ⚠️ **本番環境**: 本番環境で使用する場合は、十分な検証とテストを実施してください
- ⚠️ **サポート**: 公式サポートは提供されません

**本番環境での使用前に、必ず独自の十分なテストを実施してください。**

## 概要

このSDKは、OpenLogi APIとの統合を簡単かつ型安全に行うためのライブラリです。商品管理、入荷依頼、出荷依頼などの主要な機能をサポートしています。

### 主な特徴

- **完全な型安全性**: TypeScriptの型システムを最大限活用し、コンパイル時にエラーを検出
- **Zodバリデーション**: リクエスト・レスポンスデータの実行時検証により、データの整合性を保証
- **関数型スタイル**: イミュータブルなデータ構造とピュアな関数を採用
- **包括的なエラーハンドリング**: カスタムエラークラスで各種エラーを適切に処理
- **リトライ機能**: ネットワークエラーやレート制限に対する自動リトライをサポート
- **ESM/CJS対応**: モダンなESモジュールと従来のCommonJS両方をサポート

## インストール

### npmの場合

```bash
npm install openlogi-api-sdk
```

### yarnの場合

```bash
yarn add openlogi-api-sdk
```

### pnpmの場合

```bash
pnpm add openlogi-api-sdk
```

### 必要な環境

- Node.js >= 18.0.0
- TypeScript >= 5.0 (TypeScriptを使用する場合)

## クイックスタート

### TypeScriptでの基本的な使い方

```typescript
import { createClient, listItems } from 'openlogi-api-sdk'

// クライアントを作成
const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
  baseUrl: 'http://localhost:8080', // 本番環境では適切なURLに変更
})

// パターン1: パラメータなしで呼び出し（全商品を取得）
const allItems = await listItems(client)
console.log(`取得した商品数: ${allItems.items.length}`)

// パターン2: 特定のIDでフィルタリング（パラメータを指定する場合、idは必須）
const response = await listItems(client, {
  id: 'item-001,item-002',  // 商品ID（必須、カンマ区切りで最大100件）
})

response.items.forEach((item) => {
  console.log(`${item.code}: ${item.name} - ¥${item.price}`)
})
```

### JavaScriptでの基本的な使い方

```javascript
const { createClient, listItems } = require('openlogi-api-sdk')

// クライアントを作成
const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
  baseUrl: 'http://localhost:8080',
})

// パターン1: パラメータなしで呼び出し（全商品を取得）
const allItems = await listItems(client)
console.log(`取得した商品数: ${allItems.items.length}`)

// パターン2: 特定のIDでフィルタリング（パラメータを指定する場合、idは必須）
const response = await listItems(client, {
  id: 'item-001,item-002',  // 商品ID（必須、カンマ区切りで最大100件）
})

console.log(`取得した商品数: ${response.items.length}`)
```

## API使用例

### 商品API

#### 商品一覧を取得

```typescript
import { createClient, listItems } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// パターン1: パラメータなしで呼び出し（全商品を取得）
const allItems = await listItems(client)

// パターン2: 特定のIDでフィルタリング（パラメータを指定する場合、idは必須）
const response = await listItems(client, {
  id: 'item-001,item-002,item-003',  // 商品ID（必須、カンマ区切りで最大100件）
})

console.log(`取得した商品数: ${response.items.length}`)
response.pagination // ページネーション情報

// パターン3: 在庫情報も含める
const responseWithStock = await listItems(client, {
  id: 'item-001',
  stock: 1,  // 在庫情報を含める（任意）
})

console.log(`在庫数: ${responseWithStock.items[0].stock}`)
```

#### 商品を作成

```typescript
import { createClient, createItem } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const newItem = await createItem(client, {
  code: 'ITEM-001',
  name: '商品名',
  price: 1000,
  temperature_zone: 'dry',
  bundled_item: false,  // 同梱物フラグ（trueの場合、この商品は同梱物として扱われます）
  fifo: true,  // FIFO（先入先出）管理
  lot_limit_type: 'expiry',  // 期限商品タイプ（'expiry' | 'manufacture'）
  expiry_at_allocatable_days: 30,  // 賞味期限の引当可能日数
  description: '商品説明',
})

console.log(`商品を作成しました: ${newItem.id}`)
```

#### 商品を一括登録

```typescript
import { createClient, bulkCreateItems } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const result = await bulkCreateItems(client, {
  items: [
    {
      code: 'ITEM-001',
      name: '商品1',
      price: 1000,
      temperature_zone: 'dry',
    },
    {
      code: 'ITEM-002',
      name: '商品2',
      price: 2000,
      temperature_zone: 'cold',
    },
  ],
})

console.log(`${result.items.length}件の商品を登録しました`)
```

#### 商品情報を更新

```typescript
import { createClient, updateItem } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const updatedItem = await updateItem(client, '12345', {
  price: 1500,
  name: '更新された商品名',
})

console.log(`商品を更新しました: ${updatedItem.name}`)
```

#### 商品を削除

```typescript
import { createClient, deleteItem } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const deletedItem = await deleteItem(client, '12345')
console.log(`商品を削除しました: ${deletedItem.id}`)
```

#### 商品画像を登録

```typescript
import { createClient, uploadItemImage } from 'openlogi-api-sdk'
import fs from 'fs'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// Node.js環境での使用例
const imageBuffer = fs.readFileSync('product-image.png')
const imageBlob = new Blob([imageBuffer], { type: 'image/png' })

const image = await uploadItemImage(client, '12345', imageBlob)

console.log(`画像を登録しました: ${image.id}`)

// ブラウザ環境での使用例（jpeg形式）
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

const browserImage = await uploadItemImage(client, '12345', file)

console.log(`画像を登録しました: ${browserImage.id}`)
```

#### 商品コードで検索・更新

```typescript
import { createClient, getItemByCode, updateItemByCode } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 商品コードで取得
const item = await getItemByCode(client, 'account-123', 'ITEM-001')
console.log(`取得: ${item.name}`)

// 商品コードで更新
const updated = await updateItemByCode(client, 'account-123', 'ITEM-001', {
  price: 2000,
})
console.log(`更新: ${updated.price}円`)
```

#### アカウントIDで商品一覧を取得

```typescript
import { createClient, listItemsByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// パターン1: 商品識別番号で取得
const response1 = await listItemsByAccountId(client, 'account-123', {
  identifier: '2015-00001,2015-00002',  // 商品識別番号（identifier または code のいずれか必須）
  stock: 1,                              // 在庫情報を含める（任意）
})

console.log(`取得した商品数: ${response1.items.length}`)

// パターン2: 商品コードで取得
const response2 = await listItemsByAccountId(client, 'account-123', {
  code: 'ITEM-001,ITEM-002',            // 商品コード（identifier または code のいずれか必須）
  stock: 1,                              // 在庫情報を含める（任意）
})

console.log(`取得した商品数: ${response2.items.length}`)
```

#### 商品コードで画像を登録

```typescript
import { createClient, uploadItemImageByCode } from 'openlogi-api-sdk'
import fs from 'fs'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const imageBuffer = fs.readFileSync('product-image.png')
const imageBlob = new Blob([imageBuffer], { type: 'image/png' })

const image = await uploadItemImageByCode(client, 'account-123', 'ITEM-001', imageBlob)
console.log(`画像を登録しました: ${image.id}`)
```

#### 商品画像を削除

```typescript
import { createClient, deleteItemImage } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// IDで画像を削除
await deleteItemImage(client, '12345', 'image-001')
console.log('画像を削除しました')
```

#### 商品コードで画像を削除

```typescript
import { createClient, deleteItemImageByCode } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 商品コードで画像を削除
await deleteItemImageByCode(client, 'account-123', 'ITEM-001', 'image-001')
console.log('画像を削除しました')
```

### 入荷API

#### 入荷依頼を作成

```typescript
import { createClient, createWarehousing } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const warehousing = await createWarehousing(client, {
  inspection_type: 'CODE', // 'CODE' | 'LOT' | 'SERIAL'
  arrival_date: '2025-01-20',
  supplier_info: {
    name: '仕入先A',
    phone: '0312345678',
  },
  items: [
    {
      code: 'ITEM-001',
      quantity: 100,
      expiry_date: '2026-01-01',
    },
    {
      code: 'ITEM-002',
      quantity: 50,
    },
  ],
  memo: '入荷メモ',
})

console.log(`入荷依頼を作成しました: ${warehousing.id}`)
```

#### 入荷依頼一覧を取得

```typescript
import { createClient, listWarehousing } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const response = await listWarehousing(client)

console.log(`入荷依頼数: ${response.warehousings.length}`)
```

#### 入荷実績を取得

```typescript
import { createClient, getStockedWarehousing, getStockedWarehousingByDate } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 直近の入荷実績を取得
const recent = await getStockedWarehousing(client)
console.log(`直近の入荷実績: ${recent.stocked_warehousings.length}件`)

// 特定日付の入荷実績を取得
const specific = await getStockedWarehousingByDate(client, 2025, 1, 20)
console.log(`2025/1/20の入荷実績: ${specific.stocked_warehousings.length}件`)
```

#### 入荷ラベルをPDF形式で取得

```typescript
import { createClient, getWarehousingLabel } from 'openlogi-api-sdk'
import fs from 'fs'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const pdfBlob = await getWarehousingLabel(client, '12345')

// Node.jsでファイルに保存
const buffer = Buffer.from(await pdfBlob.arrayBuffer())
fs.writeFileSync('warehousing-label.pdf', buffer)
console.log('PDFラベルを保存しました')

// ブラウザでダウンロード
// const url = URL.createObjectURL(pdfBlob)
// const a = document.createElement('a')
// a.href = url
// a.download = 'warehousing-label.pdf'
// a.click()
```

### 出荷API

#### 出荷依頼を作成

```typescript
import { createClient, createShipment } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const shipment = await createShipment(client, {
  order_no: 'ORDER-2025-001',
  shipping_date: '2025-01-25',
  items: [
    {
      code: 'ITEM-001',
      quantity: 2,
    },
    {
      code: 'ITEM-002',
      quantity: 1,
    },
  ],
  delivery_info: {
    name: '山田太郎',
    postcode: '1000001',
    prefecture: '東京都',
    city: '千代田区',
    address1: '千代田1-1-1',
    address2: 'ABCビル3階',
    phone: '09012345678',
    delivery_time: 'afternoon', // 午前、午後、夜間など
  },
  shipping_method: 'standard', // 配送方法
  payment_method: 'prepaid', // 支払い方法
  gift_wrapping: false,
  memo: '配送メモ',
})

console.log(`出荷依頼を作成しました: ${shipment.id}`)
```

#### 出荷依頼を一括作成

```typescript
import { createClient, bulkCreateShipments } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const result = await bulkCreateShipments(client, {
  shipments: [
    {
      order_no: 'ORDER-001',
      items: [{ code: 'ITEM-001', quantity: 1 }],
      delivery_info: {
        name: '山田太郎',
        postcode: '1000001',
        prefecture: '東京都',
        city: '千代田区',
        address1: '千代田1-1-1',
        phone: '09012345678',
      },
    },
    {
      order_no: 'ORDER-002',
      items: [{ code: 'ITEM-002', quantity: 2 }],
      delivery_info: {
        name: '佐藤花子',
        postcode: '1500001',
        prefecture: '東京都',
        city: '渋谷区',
        address1: '神宮前1-1-1',
        phone: '09087654321',
      },
    },
  ],
})

console.log(`作成件数: ${result.shipments.length}件`)
```

#### 出荷依頼を更新

```typescript
import { createClient, updateShipment } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const updated = await updateShipment(client, '12345', {
  shipping_date: '2025-01-26',
  delivery_info: {
    name: '山田太郎',
    postcode: '1000002',
    prefecture: '東京都',
    city: '千代田区',
    address1: '千代田2-2-2',
    phone: '09012345678',
  },
})

console.log(`出荷依頼を更新しました: ${updated.id}`)
```

#### 出荷依頼を修正（処理中の依頼に対して）

```typescript
import { createClient, modifyShipment } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const modified = await modifyShipment(client, 'TS001-S000001', {
  recipient: {
    name: '山田太郎',
    postcode: '1000003',
    prefecture: '東京都',
    address1: '千代田3-3-3',
    phone: '09012345678',
  },
  delivery_time_slot: 'AM',
  delivery_date: '2025-02-01',
})

console.log(`出荷依頼を修正しました: ${modified.id}`)
```

#### 出荷依頼をキャンセル

```typescript
import { createClient, cancelShipment } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const cancelled = await cancelShipment(client, '12345')
console.log(`出荷依頼をキャンセルしました: ${cancelled.status}`)
```

#### アカウントIDで出荷依頼一覧を取得

```typescript
import { createClient, listShipmentsByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const response = await listShipmentsByAccountId(client, 'TS001', {
  identifier: '2015-00001,2015-00002',
})

console.log(`取得した出荷依頼数: ${response.shipments.length}`)
```

#### アカウントIDとidentifierで出荷依頼を取得

```typescript
import { createClient, getShipmentByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const shipment = await getShipmentByAccountId(client, 'TS001', '2015-00001')
console.log(`出荷依頼を取得しました: ${shipment.id}`)
```

#### アカウントIDとidentifierで出荷依頼を更新

```typescript
import { createClient, updateShipmentByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const updated = await updateShipmentByAccountId(client, 'TS001', '2015-00001', {
  shipping_date: '2025-01-26',
})

console.log(`出荷依頼を更新しました: ${updated.id}`)
```

#### アカウントIDとidentifierで出荷依頼を削除

```typescript
import { createClient, deleteShipmentByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

await deleteShipmentByAccountId(client, 'TS001', '2015-00001')
console.log('出荷依頼を削除しました')
```

#### アカウントIDとidentifierで出荷依頼を修正

```typescript
import { createClient, modifyShipmentByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const modified = await modifyShipmentByAccountId(client, 'TS001', '2015-00001', {
  recipient: {
    name: '山田太郎',
    postcode: '1000004',
    prefecture: '東京都',
    address1: '千代田4-4-4',
    phone: '09012345678',
  },
  delivery_time_slot: '14',
  delivery_date: '2025-02-05',
})

console.log(`出荷依頼を修正しました: ${modified.id}`)
```

#### アカウントIDとidentifierで出荷依頼をキャンセル

```typescript
import { createClient, cancelShipmentByAccountId } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const cancelled = await cancelShipmentByAccountId(client, 'TS001', '2015-00001')
console.log(`出荷依頼をキャンセルしました: ${cancelled.status}`)
```

#### 倉庫移動を作成

```typescript
import { createClient, createTransfer } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const transfer = await createTransfer(client, {
  warehouse: 'BASE2',              // 移動元倉庫コード
  destination: { warehouse: 'BASE3' }, // 移動先倉庫コード
  items: [
    {
      code: 'item-001',
      quantity: 10,
      name: '勇者の盾',
    },
  ],
})

console.log(`倉庫移動を作成しました: ${transfer.id}`)
console.log(`移動先倉庫: ${transfer.destination?.warehouse}`)
```

#### 倉庫移動を更新

```typescript
import { createClient, updateTransfer } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

const transfer = await updateTransfer(client, 'TS001-S000001', {
  destination: { warehouse: 'BASE4' },
  items: [
    { code: 'item-002', quantity: 20 },
  ],
})

console.log(`倉庫移動を更新しました: ${transfer.id}`)
```

#### 倉庫移動を修正

```typescript
import { createClient, modifyTransfer } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// ピッキング中の倉庫移動依頼の修正を依頼
// 注意: データ取り込み後の修正となるため、別途事務手数料＋作業費用が発生します
const transfer = await modifyTransfer(client, 'TS001-S000001', {
  destination: { warehouse: 'BASE5' },
})

console.log(`倉庫移動を修正しました: ${transfer.id}`)
```

#### 倉庫移動をキャンセル

```typescript
import { createClient, cancelTransfer } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// ピッキング中の倉庫移動依頼のキャンセルを依頼
// 注意: データ取り込み後のキャンセルとなるため、別途事務手数料＋作業費用が発生します
const transfer = await cancelTransfer(client, 'TS001-S000001')

console.log(`倉庫移動をキャンセルしました: ${transfer.status}`)
```

#### 出荷実績一覧を取得

```typescript
import { createClient, listShippedShipments } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 全ての出荷実績を取得
const response = await listShippedShipments(client)

console.log(`出荷実績数: ${response.shipments.length}件`)

// 出荷実績の詳細を表示
response.shipments.forEach((shipment) => {
  console.log(`出荷ID: ${shipment.id}`)
  console.log(`受注番号: ${shipment.order_no}`)
  console.log(`配送先: ${shipment.delivery_info?.name}`)
})

// クエリパラメータを指定して取得
const filteredResponse = await listShippedShipments(client, {
  page: 1,
  per_page: 50,
})

console.log(`取得した出荷実績: ${filteredResponse.shipments.length}件`)
```

#### 特定日付の出荷実績を取得

```typescript
import { createClient, getShippedShipmentByDate } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 2025年1月20日の出荷実績を取得
const response = await getShippedShipmentByDate(client, 2025, 1, 20)

console.log(`2025/1/20の出荷実績: ${response.shipments.length}件`)

// 各出荷の詳細を表示
response.shipments.forEach((shipment) => {
  console.log(`- ${shipment.order_no}: ${shipment.delivery_info?.name}様`)
})
```

#### 国際発送の国コード一覧を取得

```typescript
import { createClient, getInternationalRegions } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 国際発送で指定可能な国コード一覧を取得
const response = await getInternationalRegions(client)

console.log(`対応国数: ${response.regions.length}カ国`)

// 国コード一覧を表示
response.regions.forEach((region) => {
  console.log(`${region.code}: ${region.name}`)
  console.log(`  最小金額: ${region.min_amount}円`)
  console.log(`  最大金額: ${region.max_amount}円`)
  console.log(`  最大重量: ${region.max_weight}g`)
})

// 例: アメリカ合衆国の情報を検索
const usa = response.regions.find((r) => r.code === 'US')
if (usa) {
  console.log(`アメリカへの発送: 最大${usa.max_weight}gまで`)
}
```

#### 国際発送の通貨一覧を取得

```typescript
import { createClient, getInternationalCurrencies } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 国際発送で指定可能な通貨一覧を取得
const response = await getInternationalCurrencies(client)

console.log(`対応通貨数: ${response.currencies.length}種類`)

// 通貨一覧を表示
response.currencies.forEach((currency) => {
  console.log(`${currency.code}: ${currency.name}`)
})

// 例: 米ドル情報の取得
const usd = response.currencies.find((c) => c.code === 'USD')
if (usd) {
  console.log(`通貨: ${usd.name} (${usd.code})`)
}
```

#### 出荷商品の引当を解除

```typescript
import { createClient, clearShipmentAllocation } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

// 基本的な引当解除
const shipment = await clearShipmentAllocation(client, '12345')

console.log(`引当を解除しました: ${shipment.id}`)
console.log(`ステータス: ${shipment.status}`)

/**
 * 注意事項:
 * - この操作により、対象出荷依頼に含まれる全ての商品から引当が解除されます
 * - 解除された在庫は入荷待ちに変更されます
 * - 解除実行後は引当復旧処理が行われず、再入荷待ちの出荷依頼から引当処理が行われます
 */
```

## エラーハンドリング

このSDKは、さまざまなエラーシナリオに対応したカスタムエラークラスを提供しています。

### エラークラス一覧

- **`OpenLogiError`**: すべてのカスタムエラーの基底クラス
- **`ApiError`**: API呼び出し時の一般的なエラー（HTTPステータス2xx以外）
- **`ValidationError`**: リクエスト・レスポンスのバリデーションエラー
- **`AuthenticationError`**: 認証エラー（HTTP 401）
- **`RateLimitError`**: レート制限エラー（HTTP 429）
- **`NotFoundError`**: リソースが見つからない（HTTP 404）

### エラーハンドリングの例

```typescript
import {
  createClient,
  getItem,
  ApiError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

try {
  // 商品情報のみを取得
  const item = await getItem(client, '12345')
  console.log(item)

  // 在庫情報を含めて取得
  const itemWithStock = await getItem(client, '12345', { stock: 1 })
  console.log(`在庫数: ${itemWithStock.stock}`)
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('認証エラー: APIトークンを確認してください')
  } else if (error instanceof NotFoundError) {
    console.error('商品が見つかりません')
  } else if (error instanceof RateLimitError) {
    console.error(`レート制限に達しました。${error.retryAfter}秒後に再試行してください`)
  } else if (error instanceof ValidationError) {
    console.error('バリデーションエラー:')
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`)
    })
  } else if (error instanceof ApiError) {
    console.error(`APIエラー (${error.statusCode}): ${error.message}`)
    console.error('レスポンス:', error.response)
  } else {
    console.error('予期しないエラー:', error)
  }
}
```

### バリデーションエラーの詳細

```typescript
import { createClient, createItem, ValidationError } from 'openlogi-api-sdk'

const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
})

try {
  const item = await createItem(client, {
    code: '', // 空文字はエラー
    price: -100, // 負の値はエラー
  })
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('バリデーションエラーの詳細:')
    error.errors.forEach((err) => {
      console.error(`フィールド: ${err.path.join('.')}`)
      console.error(`メッセージ: ${err.message}`)
      console.error(`コード: ${err.code}`)
    })
  }
}
```

## 型定義

このSDKは、TypeScriptの型システムを最大限活用しています。すべてのAPI呼び出しは適切に型付けされており、IDEの補完機能とコンパイル時の型チェックを利用できます。

### Zodスキーマの活用

すべてのリクエスト・レスポンスはZodスキーマで定義されており、実行時にも型安全性が保証されます。

```typescript
import { CreateItemRequestSchema, ItemResponseSchema } from 'openlogi-api-sdk'

// スキーマを直接使用した検証
const data = {
  code: 'ITEM-001',
  price: 1000,
  name: 'サンプル商品',
}

const result = CreateItemRequestSchema.safeParse(data)
if (result.success) {
  console.log('有効なデータ:', result.data)
} else {
  console.error('バリデーションエラー:', result.error)
}
```

### 主要な型

```typescript
import type {
  // 商品
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
  ListItemsQuery,
  ListItemsResponse,

  // 入荷
  WarehousingResponse,
  CreateWarehousingRequest,
  UpdateWarehousingRequest,
  ListWarehousingQuery,
  ListWarehousingResponse,

  // 出荷
  ShipmentResponse,
  CreateShipmentRequest,
  UpdateShipmentRequest,
  ListShipmentsQuery,
  ListShipmentsResponse,

  // 共通
  PaginationMeta,
} from 'openlogi-api-sdk'
```

## 設定オプション

### ClientConfigの詳細

```typescript
import { createClient } from 'openlogi-api-sdk'

const client = createClient({
  // APIトークン（必須）
  apiToken: 'YOUR_API_TOKEN',

  // ベースURL（オプション、デフォルト: 'http://localhost:8080'）
  baseUrl: 'https://api.openlogi.com',

  // APIバージョン（オプション、デフォルト: '1.5'）
  apiVersion: '1.5',

  // タイムアウト（ミリ秒、オプション、デフォルト: 30000）
  timeout: 60000,

  // リトライ設定（オプション）
  retry: {
    // リトライ回数（デフォルト: 2）
    limit: 3,

    // リトライ対象のHTTPメソッド（デフォルト: ['get', 'put', 'head', 'delete', 'options', 'trace']）
    methods: ['get', 'post', 'put', 'delete'],

    // リトライ対象のHTTPステータスコード（デフォルト: [408, 413, 429, 500, 502, 503, 504]）
    statusCodes: [408, 429, 500, 502, 503, 504],

    // リトライ間隔（ミリ秒、デフォルト: 指数バックオフ）
    delay: (attemptCount) => Math.min(1000 * 2 ** attemptCount, 30000),

    // バックオフの上限（ミリ秒）
    backoffLimit: 30000,
  },
})
```

### シンプルなリトライ設定

```typescript
import { createClient } from 'openlogi-api-sdk'

// リトライ回数のみを指定（他はデフォルト値を使用）
const client = createClient({
  apiToken: 'YOUR_API_TOKEN',
  retry: 5, // 5回までリトライ
})
```

## 開発

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/openlogi-api-sdk.git
cd openlogi-api-sdk

# 依存関係をインストール
npm install

# 型チェック
npm run type-check

# Lintチェック
npm run lint

# フォーマットチェック
npm run format:check
```

### テストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジレポートを生成
npm test -- --coverage
```

### ビルド

```bash
# ビルド実行
npm run build

# dist/ディレクトリに以下が生成されます:
# - index.js (ESM)
# - index.cjs (CommonJS)
# - index.d.ts (型定義)
```

### コントリビューション

プルリクエストを歓迎します。以下の手順でコントリビュートできます：

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約

- **TypeScript**: 厳格な型チェックを有効化
- **ESLint**: `@typescript-eslint`ルールセットに準拠
- **Prettier**: コードフォーマッターを使用
- **テスト**: 新機能には必ずテストを追加

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 注意事項

- **非公式SDK**: このSDKはOpenLogiの公式SDKではありません。個人または組織での使用を目的としています。
- **API仕様**: OpenLogi APIの仕様については、公式ドキュメントを参照してください。
- **本番環境**: 本番環境で使用する前に、十分なテストを実施してください。
- **セキュリティ**: APIトークンは環境変数などで管理し、ソースコードに直接記載しないでください。

## リンク

- [OpenLogi 公式サイト](https://service.openlogi.com/)
- [API仕様書](https://api.openlogi.com/doc/api.html)
- [Issues](https://github.com/your-repo/openlogi-api-sdk/issues)
- [Changelog](CHANGELOG.md)

## サポート

質問や問題がある場合は、[GitHub Issues](https://github.com/your-repo/openlogi-api-sdk/issues)で報告してください。

---

Made with TypeScript
