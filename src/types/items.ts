/**
 * Item type definitions and schemas for the OpenLogi API SDK
 *
 * @packageDocumentation
 */

import { z } from 'zod'
import { TemperatureZoneSchema, LotLimitTypeSchema } from './common'

/**
 * 価格スキーマ（リクエスト/レスポンスで数値または数値文字列）
 */
const ItemPriceSchema = z.union([
  z.number().int().min(0),
  z.string().regex(/^\d+$/, { message: 'Price must be a numeric string' }),
])

export type ItemPrice = z.infer<typeof ItemPriceSchema>

/**
 * 商品の国際情報
 */
export const ItemInternationalInfoSchema = z.object({
  /** インボイス要約（3-75文字） */
  invoice_summary: z.string().min(3).max(75),
  /** 原産国（大文字2文字の国コード） */
  origin: z
    .string()
    .length(2)
    .regex(/^[A-Z][A-Z]$/, { message: 'Origin must be 2 uppercase letters' }),
})

export type ItemInternationalInfo = z.infer<typeof ItemInternationalInfoSchema>

/**
 * 商品画像
 */
export const ItemImageSchema = z.object({
  /** 画像URL */
  url: z.string().url(),
  /** 画像の説明 */
  alt: z.string().optional(),
  /** 表示順序 */
  order: z.number().int().min(0).optional(),
})

export type ItemImage = z.infer<typeof ItemImageSchema>

/**
 * 子商品情報（セット商品の構成要素）
 */
export const ChildItemSchema = z.object({
  /** 商品ID */
  id: z.string().optional(),
  /** 商品コード */
  code: z.string().min(1).max(30),
  /** 数量 */
  quantity: z.number().int().min(1),
})

export type ChildItem = z.infer<typeof ChildItemSchema>

/**
 * 商品作成リクエストのスキーマ
 *
 * Note: .passthrough() を使用して、将来的なAPI拡張に対応しています。
 * 定義されていないフィールドは検証されませんが、そのままAPIに送信されます。
 */
export const CreateItemRequestSchema = z
  .object({
    /** 商品コード（必須、1-30文字） */
    code: z.string().min(1).max(30),
    /** 価格（任意、数値または数値文字列） */
    price: ItemPriceSchema.optional(),
    /** 商品名（最大255文字） */
    name: z.string().max(255).optional(),
    /** 軽減税率対象 */
    is_reduced_tax: z.boolean().nullish(),
    /** HSコード（パターン: ^\d{4}\.?\d{2}((\.|-)?\d{3,4})?$） */
    hs_code: z
      .string()
      .regex(/^\d{4}\.?\d{2}((\.|-)?\d{3,4})?$/, {
        message: 'HS code must match pattern: ^\\d{4}\\.?\\d{2}((\\.|-)\\d{3,4})?$',
      })
      .optional(),
    /** バーコード（最大30文字） */
    barcode: z.string().max(30).optional(),
    /** 国際情報 */
    international_info: ItemInternationalInfoSchema.optional(),
    /** 子商品リスト（セット商品の場合、1-10個） */
    child_items: z.array(ChildItemSchema).min(1).max(10).optional(),
    /** タグリスト（各要素最大255文字） */
    tags: z.array(z.string().max(255)).optional(),
    /** 温度帯（デフォルト: "dry"） */
    temperature_zone: TemperatureZoneSchema.optional(),
    /** FIFO（先入先出）管理 */
    fifo: z.boolean().optional(),
    /** ロット制限タイプ */
    lot_limit_type: LotLimitTypeSchema.optional(),
    /** 賞味期限の引当可能日数（0以上） */
    expiry_at_allocatable_days: z.number().int().min(0).optional(),
    /** 製造日の引当可能日数（0以上） */
    manufacture_date_allocatable_days: z.number().int().min(0).optional(),
  })
  .passthrough()

export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>

/**
 * 商品更新リクエストのスキーマ（bundled_itemを含む）
 * OpenAPI仕様のItemRequestWithBundledItemに対応
 */
export const UpdateItemRequestSchema = CreateItemRequestSchema.extend({
  /** 同梱物フラグ（更新時のみ使用可能） */
  bundled_item: z.boolean().nullish(),
}).partial()

export type UpdateItemRequest = z.infer<typeof UpdateItemRequestSchema>

/**
 * 商品レスポンスのスキーマ
 */
export const ItemResponseSchema = z.object({
  /** 商品ID */
  id: z.string(),
  /** 商品コード */
  code: z.string(),
  /** 商品名（必須） */
  name: z.string(),
  /** 価格 */
  price: ItemPriceSchema.optional(),
  /** 軽減税率対象 */
  is_reduced_tax: z.boolean().nullish(),
  /** HSコード */
  hs_code: z.string().optional(),
  /** バーコード */
  barcode: z.string().optional(),
  /** 商品バーコードリスト */
  item_barcodes: z.array(z.string()).optional(),
  /** 品名（国内発送時の送り状に記載、最大16文字） */
  description: z.string().max(16).optional(),
  /** 国際情報 */
  international_info: ItemInternationalInfoSchema.optional(),
  /** 商品画像リスト */
  images: z.array(ItemImageSchema).optional(),
  /** 子商品リスト */
  child_items: z.array(ChildItemSchema).optional(),
  /** タグリスト */
  tags: z.array(z.string()).optional(),
  /** 在庫数（レスポンスのみ） */
  stock: z.number().optional(),
  /** 各倉庫の在庫情報 */
  stocks: z.array(z.unknown()).optional(),
  /** 同梱物フラグ */
  bundled_item: z.boolean().nullish(),
  /** AMAZON FBA用のFNSKU */
  externalCode: z.string().optional(),
  /** 非表示設定 */
  hidden: z.boolean().optional(),
  /** 温度帯 */
  temperature_zone: TemperatureZoneSchema.optional(),
  /** FIFO（先入先出）管理 */
  fifo: z.boolean().optional(),
  /** ロット制限タイプ */
  lot_limit_type: LotLimitTypeSchema.optional(),
  /** 賞味期限の引当可能日数 */
  expiry_at_allocatable_days: z.number().int().optional(),
  /** 製造日の引当可能日数 */
  manufacture_date_allocatable_days: z.number().int().optional(),
  /** 賞味期限 */
  expiry_at: z.string().nullable().optional(),
  /** 製造年月日 */
  manufacture_date: z.string().nullable().optional(),
  /** 引当可能期限 */
  lot_allocatable_at: z.string().nullable().optional(),
  /** ロット引当順 */
  lot_allocatable_priority: z.number().int().nullable().optional(),
  /** 作成日時 */
  created_at: z.string().optional(),
  /** 更新日時 */
  updated_at: z.string().optional(),
})

export type ItemResponse = z.infer<typeof ItemResponseSchema>

/**
 * 商品リスト取得のクエリパラメータ
 * 公式ドキュメント通り、id（必須）とstock（オプション）のみを受け付ける
 */
export const ListItemsQuerySchema = z.object({
  /** 商品ID指定（カンマ区切りで最大100件） */
  id: z.string(),
  /** 在庫情報を含むかどうか */
  stock: z.literal(1).optional(),
})

export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>

/**
 * 商品リストレスポンス
 */
export const ListItemsResponseSchema = z.object({
  /** 商品リスト */
  items: z.array(ItemResponseSchema),
})

export type ListItemsResponse = z.infer<typeof ListItemsResponseSchema>

/**
 * 商品取得クエリ
 */
export const GetItemQuerySchema = z.object({
  /** 在庫情報を含むかどうか */
  stock: z.literal(1).optional(),
})

export type GetItemQuery = z.infer<typeof GetItemQuerySchema>

/**
 * アカウントIDを指定した商品一覧取得のクエリパラメータ
 * identifier または code のどちらか一方が必須
 */
export const ListItemsByAccountIdQuerySchema = z
  .object({
    /** 商品識別番号（カンマ区切り最大100件） */
    identifier: z.string().optional(),
    /** 商品コード（カンマ区切り最大100件） */
    code: z.string().optional(),
    /** 在庫情報を含めるフラグ */
    stock: z.literal(1).optional(),
  })
  .refine((data) => !!data.identifier || !!data.code, {
    message: 'Either identifier or code must be provided',
  })

export type ListItemsByAccountIdQuery = z.infer<typeof ListItemsByAccountIdQuerySchema>

/**
 * 商品一括登録リクエスト
 */
export const BulkItemRequestSchema = z.object({
  /** 商品リスト（1-100個） */
  items: z.array(CreateItemRequestSchema).min(1).max(100),
})

export type BulkItemRequest = z.infer<typeof BulkItemRequestSchema>

/**
 * 商品一括登録レスポンス（仕様準拠）
 */
export const BulkItemResponseSchema = z.object({
  /** 登録された商品リスト */
  items: z.array(ItemResponseSchema),
})

export type BulkItemResponse = z.infer<typeof BulkItemResponseSchema>
