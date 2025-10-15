/**
 * Warehousing type definitions and schemas for the OpenLogi API SDK
 *
 * @packageDocumentation
 */

import { z } from 'zod'
import {
  InspectionTypeSchema,
  SalesMethodSchema,
  TransportModeSchema,
  IdentityTypeSchema,
  VehicleSizeSchema,
  CarryingMethodSchema,
  DateStringSchema,
} from './common'

/**
 * 入荷商品情報（リクエスト用）
 * 公式APIではcodeとquantityのみ
 */
export const WarehousingItemSchema = z.object({
  /** 商品コード（必須） */
  code: z.string(),
  /** 数量（必須、最大: 999999999） */
  quantity: z.number().int().min(1).max(999999999),
})

export type WarehousingItem = z.infer<typeof WarehousingItemSchema>

/**
 * ロット情報
 */
export const LotItemSchema = z.object({
  /** ロットID */
  id: z.string(),
  /** 賞味期限 */
  expiry_at: z.string().nullish(),
  /** 製造日 */
  manufacture_date: z.string().nullish(),
  /** ロット引当可能日 */
  lot_allocatable_at: z.string().nullish(),
  /** 入荷実績数 */
  received: z.number().int().min(0),
})

export type LotItem = z.infer<typeof LotItemSchema>

/**
 * ケース情報
 */
export const CaseInfoSchema = z.object({
  /** ケース内数量 */
  quantity_in_case: z.number().int().min(1),
  /** 数量 */
  quantity: z.number().int().min(1),
})

export type CaseInfo = z.infer<typeof CaseInfoSchema>

/**
 * 入荷商品の基本情報（schemas-ItemResponse相当）
 * POST/PUT/DELETE時に使用
 */
export const WarehousingItemBaseSchema = z.object({
  /** 商品ID */
  id: z.string(),
  /** 商品コード */
  code: z.string(),
  /** 商品名 */
  name: z.string(),
  /** 数量 */
  quantity: z.number().int().min(1),
})

export type WarehousingItemBase = z.infer<typeof WarehousingItemBaseSchema>

/**
 * 入荷商品情報+入荷実績（ItemReceivedResponse相当）
 * GET /warehousingsの一覧取得時に使用
 */
export const WarehousingItemWithReceivedSchema = WarehousingItemBaseSchema.extend({
  /** 入荷実績数 */
  received: z.number().int().min(0).optional(),
})

export type WarehousingItemWithReceived = z.infer<typeof WarehousingItemWithReceivedSchema>

/**
 * 入荷商品詳細情報（レスポンス用）
 * GET /warehousings/{id}、GET /warehousings/stockedの詳細取得時に使用
 */
export const WarehousingItemDetailResponseSchema = WarehousingItemWithReceivedSchema.extend({
  /** ロット情報（詳細取得時に含まれる） */
  lot_items: z.array(LotItemSchema).optional(),
  /** ケース情報（詳細取得時に含まれる） */
  cases: z.array(CaseInfoSchema).optional(),
  /** 入庫数（詳細取得時に含まれる） */
  warehoused_count: z.number().int().min(0).optional(),
})

export type WarehousingItemDetailResponse = z.infer<typeof WarehousingItemDetailResponseSchema>

/**
 * 後方互換性のための型エイリアス
 * @deprecated Use WarehousingItemBase instead
 */
export const WarehousingItemResponseSchema = WarehousingItemBaseSchema
export type WarehousingItemResponse = WarehousingItemBase

/**
 * 入荷作成リクエストのベーススキーマ
 */
const CreateWarehousingRequestBaseSchema = z.object({
  /** 検品タイプ（必須） */
  inspection_type: InspectionTypeSchema,
  /** 入荷商品リスト（必須、1-25個） */
  items: z
    .array(WarehousingItemSchema)
    .min(1)
    .max(25)
    .refine(
      (items) => {
        const codes = items.map((item) => item.code)
        return codes.length === new Set(codes).size
      },
      {
        message: 'items must not contain duplicate product codes',
        path: ['items'],
      },
    ),
  /** 入荷予定日（必須） */
  arrival_date: DateStringSchema,
  /** 入荷予定日確定フラグ */
  arrival_date_confirmed: z.boolean().optional(),
  /** 入荷時間帯（開始時刻、0-23） */
  arrival_time_from: z.number().int().min(0).max(23).optional(),
  /** 入荷時間帯（終了時刻、0-23） */
  arrival_time_to: z.number().int().min(0).max(23).optional(),
  /** 販売方法（デフォルト: "INVENTORY"） */
  sales_method: SalesMethodSchema.optional(),
  /** 出荷予定日 */
  shipping_scheduled_date: DateStringSchema.optional(),
  /** 輸送方法（デフォルト: "HOME_DELIVERY"） */
  transport_mode: TransportModeSchema.optional(),
  /** 識別タイプ */
  identity_type: IdentityTypeSchema.optional(),
  /** 識別値リスト */
  identity_values: z.array(z.string()).optional(),
  /** 追跡コードリスト */
  tracking_codes: z.array(z.string()).optional(),
  /** 車両コード（最大30文字） */
  vehicle_code: z.string().max(30).optional(),
  /** 車両サイズ */
  vehicle_size: VehicleSizeSchema.optional(),
  /** 運搬方法 */
  carrying_method: CarryingMethodSchema.optional(),
  /** コンテナ番号（最大30文字） */
  container_no: z.string().max(30).optional(),
  /** ドライバー情報（最大500文字） */
  driver_info: z.string().max(500).optional(),
  /** 会社メモ（最大255文字） */
  company_memo: z.string().max(255).optional(),
  /** 識別子（最大30文字） */
  identifier: z.string().max(30).optional(),
})

/**
 * 入荷作成リクエストのスキーマ
 */
export const CreateWarehousingRequestSchema = CreateWarehousingRequestBaseSchema.refine(
  (data) => {
    // arrival_time_from と arrival_time_to が両方指定されている場合、from <= to を検証
    if (data.arrival_time_from !== undefined && data.arrival_time_to !== undefined) {
      return data.arrival_time_from <= data.arrival_time_to
    }
    return true
  },
  {
    message: 'arrival_time_from must be less than or equal to arrival_time_to',
    path: ['arrival_time_from'],
  },
)

export type CreateWarehousingRequest = z.infer<typeof CreateWarehousingRequestSchema>

/**
 * 入荷更新リクエストのスキーマ
 * 公式仕様ではPOST/PUTともにWarehousingRequestを使用
 */
export const UpdateWarehousingRequestSchema = CreateWarehousingRequestSchema

export type UpdateWarehousingRequest = CreateWarehousingRequest

/**
 * 入荷ステータス（公式API仕様に準拠）
 */
export const WarehousingStatusSchema = z.enum([
  'waiting', // 入荷待ち
  'received', // 入荷済み
  'checking', // 検品中
  'stocked', // 入庫済み
])

export type WarehousingStatus = z.infer<typeof WarehousingStatusSchema>

/**
 * 入荷レスポンスの基本スキーマ
 * POST/PUT/DELETE時に使用（shipment_returnフィールドなし）
 */
export const WarehousingResponseSchema = z.object({
  /** 入荷ID */
  id: z.string(),
  /** 入荷ステータス */
  status: WarehousingStatusSchema,
  /** 検品タイプ */
  inspection_type: InspectionTypeSchema,
  /** 入荷商品リスト */
  items: z.array(WarehousingItemBaseSchema),
  /** 入荷予定日 */
  arrival_date: z.string(),
  /** 入荷予定日確定フラグ */
  arrival_date_confirmed: z.boolean().nullish(),
  /** 入荷時間帯（開始時刻） */
  arrival_time_from: z.number().int().nullish(),
  /** 入荷時間帯（終了時刻） */
  arrival_time_to: z.number().int().nullish(),
  /** 販売方法 */
  sales_method: SalesMethodSchema.nullish(),
  /** 出荷予定日 */
  shipping_scheduled_date: z.string().nullish(),
  /** 輸送方法 */
  transport_mode: TransportModeSchema.nullish(),
  /** 識別タイプ */
  identity_type: IdentityTypeSchema.nullish(),
  /** 識別値リスト */
  identity_values: z.array(z.string()).nullish(),
  /** 追跡コードリスト */
  tracking_codes: z.array(z.string()).nullish(),
  /** 車両コード */
  vehicle_code: z.string().nullish(),
  /** 車両サイズ */
  vehicle_size: VehicleSizeSchema.nullish(),
  /** 運搬方法 */
  carrying_method: CarryingMethodSchema.nullish(),
  /** コンテナ番号 */
  container_no: z.string().nullish(),
  /** ドライバー情報 */
  driver_info: z.string().nullish(),
  /** 会社メモ */
  company_memo: z.string().nullish(),
  /** 識別子 */
  identifier: z.string().nullish(),
  /** 倉庫コード */
  warehouse: z.string().nullish(),
  /** 倉庫情報 */
  warehouse_info: z
    .object({
      postcode: z.string().nullish(),
      address: z.string().nullish(),
      name: z.string().nullish(),
    })
    .nullish(),
  /** 作成ユーザー */
  create_user: z
    .object({
      name: z.string(),
    })
    .nullish(),
  /** 在庫期限日 */
  stock_deadline_date: z.string().nullish(),
  /** 検品タイプラベル */
  inspection_type_label: z.string().nullish(),
  /** 中間フラグ */
  halfway: z.boolean().nullish(),
  /** 作成日時 */
  created_at: z.string().nullish(),
})

export type WarehousingResponse = z.infer<typeof WarehousingResponseSchema>

/**
 * 一覧取得時の各入荷情報スキーマ
 * GET /warehousingsで使用（shipment_return + receivedを含む）
 */
export const WarehousingListItemSchema = WarehousingResponseSchema.extend({
  /** 返品入荷フラグ */
  shipment_return: z.boolean().nullish(),
  /** 入荷商品リスト（receivedを含む） */
  items: z.array(WarehousingItemWithReceivedSchema),
})

export type WarehousingListItem = z.infer<typeof WarehousingListItemSchema>

/**
 * 入荷詳細レスポンス（入荷実績などを含む）
 * GET /warehousings/{id}、GET /warehousings/stockedで使用
 */
export const WarehousingDetailResponseSchema = WarehousingResponseSchema.extend({
  /** 返品入荷フラグ */
  shipment_return: z.boolean().nullish(),
  /** 入荷商品リスト（詳細情報付き） */
  items: z.array(WarehousingItemDetailResponseSchema),
})

export type WarehousingDetailResponse = z.infer<typeof WarehousingDetailResponseSchema>

/**
 * 入荷リストレスポンス（公式APIではクエリパラメータなし、ページネーションなし）
 */
export const ListWarehousingResponseSchema = z.object({
  /** 入荷リスト */
  warehousings: z.array(WarehousingListItemSchema),
})

export type ListWarehousingResponse = z.infer<typeof ListWarehousingResponseSchema>

/**
 * 入荷実績取得のクエリパラメータ（YYYYMMDD形式）
 */
export const StockedWarehousingQuerySchema = z.object({
  /** 指定日以前の入荷実績を取得（YYYYMMDD形式） */
  date_before: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
  /** 指定日以降の入荷実績を取得（YYYYMMDD形式） */
  date_after: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
})

export type StockedWarehousingQuery = z.infer<typeof StockedWarehousingQuerySchema>

/**
 * 指定年月日の入荷実績取得パラメータ
 */
export const GetStockedWarehousingByDateParamsSchema = z.object({
  /** 年（1900-2100の整数） */
  year: z.number().int().min(1900).max(2100),
  /** 月（1-12の整数） */
  month: z.number().int().min(1).max(12),
  /** 日（1-31の整数、オプショナル） */
  day: z.number().int().min(1).max(31).optional(),
})

export type GetStockedWarehousingByDateParams = z.infer<
  typeof GetStockedWarehousingByDateParamsSchema
>

/**
 * 入荷実績レスポンス
 */
export const StockedWarehousingResponseSchema = z.object({
  /** 入荷実績リスト */
  warehousings: z.array(WarehousingDetailResponseSchema),
})

export type StockedWarehousingResponse = z.infer<typeof StockedWarehousingResponseSchema>
