/**
 * Common type definitions and schemas for the OpenLogi API SDK
 *
 * @packageDocumentation
 */

import { z } from 'zod'

/**
 * 温度帯の型定義
 * - dry: 常温
 * - constant: 定温
 * - chilled: チルド
 * - frozen: 冷凍
 */
export const TemperatureZoneSchema = z.enum(['dry', 'constant', 'chilled', 'frozen']).default('dry')

export type TemperatureZone = z.infer<typeof TemperatureZoneSchema>

/**
 * ロット制限タイプ
 * - expiry: 賞味期限
 * - manufacture: 製造日
 */
export const LotLimitTypeSchema = z.enum(['expiry', 'manufacture'])

export type LotLimitType = z.infer<typeof LotLimitTypeSchema>

/**
 * 検品タイプ
 * - ID: ID検品
 * - NAME: 商品名検品
 * - CODE: 商品コード検品
 * - BARCODE: バーコード検品
 * - LABEL: ラベル検品
 */
export const InspectionTypeSchema = z.enum(['ID', 'NAME', 'CODE', 'BARCODE', 'LABEL'])

export type InspectionType = z.infer<typeof InspectionTypeSchema>

/**
 * 販売方法
 * - INVENTORY: 在庫販売
 * - RESERVATION: 予約販売
 * - OTHER: その他
 */
export const SalesMethodSchema = z.enum(['INVENTORY', 'RESERVATION', 'OTHER']).default('INVENTORY')

export type SalesMethod = z.infer<typeof SalesMethodSchema>

/**
 * 輸送方法
 * - HOME_DELIVERY: 宅配便
 * - CHARTER: チャーター便
 * - CONTAINER: コンテナ
 */
export const TransportModeSchema = z
  .enum(['', 'HOME_DELIVERY', 'CHARTER', 'CONTAINER'])
  .default('HOME_DELIVERY')

export type TransportMode = z.infer<typeof TransportModeSchema>

/**
 * 識別タイプ
 * - ID_OR_LABEL: IDまたはラベル
 * - SUPPLIER: 仕入先
 * - TRACKING_CODE: 追跡コード
 * - VEHICLE_CODE: 車両コード
 * - CONTAINER: コンテナ
 */
export const IdentityTypeSchema = z.enum([
  'ID_OR_LABEL',
  'SUPPLIER',
  'TRACKING_CODE',
  'VEHICLE_CODE',
  'CONTAINER',
])

export type IdentityType = z.infer<typeof IdentityTypeSchema>

/**
 * 車両サイズ
 * - UNDER_2T: 2t未満
 * - 4T: 4t車
 * - 10T: 10t車
 * - 20FT: 20ftコンテナ
 * - 40FT: 40ftコンテナ
 */
export const VehicleSizeSchema = z.enum(['UNDER_2T', '4T', '10T', '20FT', '40FT'])

export type VehicleSize = z.infer<typeof VehicleSizeSchema>

/**
 * 運搬方法
 * - PALETTE: パレット
 * - BARA: バラ
 */
export const CarryingMethodSchema = z.enum(['PALETTE', 'BARA'])

export type CarryingMethod = z.infer<typeof CarryingMethodSchema>

/**
 * 緩衝材単位
 * - ORDER: 注文単位
 * - ITEM: 商品単位
 */
export const CushioningUnitSchema = z.enum(['ORDER', 'ITEM'])

export type CushioningUnit = z.infer<typeof CushioningUnitSchema>

/**
 * 緩衝材タイプ
 * - BUBBLE_PACK: バブルパック
 * - BUBBLE_DOUBLE_PACK: ダブルバブルパック
 */
export const CushioningTypeSchema = z.enum(['BUBBLE_PACK', 'BUBBLE_DOUBLE_PACK'])

export type CushioningType = z.infer<typeof CushioningTypeSchema>

/**
 * ギフトラッピング単位
 * - ORDER: 注文単位
 * - ITEM: 商品単位
 */
export const GiftWrappingUnitSchema = z.enum(['ORDER', 'ITEM'])

export type GiftWrappingUnit = z.infer<typeof GiftWrappingUnitSchema>

/**
 * ギフトラッピングタイプ
 * - NAVY: ネイビー
 * - RED: レッド
 */
export const GiftWrappingTypeSchema = z.enum(['NAVY', 'RED'])

export type GiftWrappingType = z.infer<typeof GiftWrappingTypeSchema>

/**
 * 納品書タイプ
 * - NOT_INCLUDE_PII: 個人情報を含まない
 * - NONE: 納品書なし
 */
export const DeliveryNoteTypeSchema = z.enum(['NOT_INCLUDE_PII', 'NONE'])

export type DeliveryNoteType = z.infer<typeof DeliveryNoteTypeSchema>

/**
 * 日付文字列のバリデーション (YYYY-MM-DD形式)
 */
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
})

export type DateString = z.infer<typeof DateStringSchema>

/**
 * メールアドレスのバリデーション
 */
export const EmailSchema = z.string().email()

export type Email = z.infer<typeof EmailSchema>

/**
 * ページネーション共通パラメータ
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
})

export type PaginationParams = z.infer<typeof PaginationParamsSchema>

/**
 * ページネーション共通レスポンス
 */
export const PaginationMetaSchema = z.object({
  current_page: z.number().int(),
  total_pages: z.number().int(),
  total_count: z.number().int(),
  per_page: z.number().int(),
})

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

/**
 * エラーレスポンス
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * 成功レスポンス
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

/**
 * 配送業者
 * - YAMATO: ヤマト運輸
 * - SAGAWA: 佐川急便
 */
export const DeliveryCarrierSchema = z.enum(['YAMATO', 'SAGAWA'])

export type DeliveryCarrier = z.infer<typeof DeliveryCarrierSchema>

/**
 * 配送時間帯
 * - AM: 午前
 * - 12: 12時-14時
 * - 14: 14時-16時
 * - 16: 16時-18時
 * - 18: 18時-20時
 * - 19: 19時-21時
 */
export const DeliveryTimeSlotSchema = z.enum(['AM', '12', '14', '16', '18', '19'])

export type DeliveryTimeSlot = z.infer<typeof DeliveryTimeSlotSchema>

/**
 * 配送方法
 * - POST_EXPRESS: 速達
 * - HOME_BOX: 宅配ボックス
 */
export const DeliveryMethodSchema = z.enum(['POST_EXPRESS', 'HOME_BOX'])

export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>

/**
 * 配送サービス（国際配送等）
 */
export const DeliveryServiceSchema = z.enum([
  'SAGAWA-HIKYAKU-YU-PACKET',
  'SAGAWA-TAKUHAIBIN',
  'SAGAWA-COOLBIN',
  'YAMATO-NEKOPOSU',
  'YAMATO-TAKKYUBIN',
  'YAMATO-COOLBIN',
  'JAPANPOST-EMS',
  'JAPANPOST-EPACKET',
  'JAPANPOST-YU-PACKET',
  'FEDEX-PRIORITY',
  'FEDEX-CONNECT-PLUS',
  'DHL-EXPRESS',
])

export type DeliveryService = z.infer<typeof DeliveryServiceSchema>

/**
 * 輸出目的
 * - GIFT: 贈物
 * - DOCUMENTS: 書類
 * - COMMERCIAL_SAMPLE: 商品見本
 * - SALE_OF_GOODS: 販売品
 * - RETURNED_GOODS: 返送品
 * - OTHERS: その他
 */
export const PurposeSchema = z.enum([
  'GIFT',
  'DOCUMENTS',
  'COMMERCIAL_SAMPLE',
  'SALE_OF_GOODS',
  'RETURNED_GOODS',
  'OTHERS',
])

export type Purpose = z.infer<typeof PurposeSchema>
