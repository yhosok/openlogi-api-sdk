/**
 * Shipment type definitions and schemas for the OpenLogi API SDK
 *
 * @packageDocumentation
 */

import { z } from 'zod'
import {
  CushioningUnitSchema,
  CushioningTypeSchema,
  GiftWrappingUnitSchema,
  GiftWrappingTypeSchema,
  DeliveryNoteTypeSchema,
  DateStringSchema,
  EmailSchema,
  DeliveryCarrierSchema,
  DeliveryTimeSlotSchema,
  DeliveryMethodSchema,
  DeliveryServiceSchema,
  PurposeSchema,
} from './common'

/**
 * 出荷商品情報
 */
export const ShipmentItemSchema = z.object({
  /** 商品ID */
  id: z.string().optional(),
  /** 商品コード */
  code: z.string().optional(),
  /** 商品名 */
  name: z.string().optional(),
  /** 数量（必須） */
  quantity: z.number().int().min(1),
  /** 単価 */
  unit_price: z.number().int().optional(),
  /** 金額 */
  price: z.number().int().optional(),
  /** 合計金額 */
  amount: z.number().int().optional(),
  /** 軽減税率適用商品フラグ */
  is_reduced_tax: z.boolean().optional(),
  /** 在庫不足時の出荷予約フラグ */
  backorder_if_unavailable: z.boolean().optional(),
  /** HSコード */
  hs_code: z.string().optional(),
  /** ギフトラッピングタイプ（商品単位） */
  gift_wrapping_type: GiftWrappingTypeSchema.optional(),
  /** 緩衝材タイプ（商品単位） */
  cushioning_type: CushioningTypeSchema.optional(),
  /** ロット番号 */
  lot_no: z.string().max(30).optional(),
  /** 賞味期限 */
  expiry_date: DateStringSchema.optional(),
  /** 備考 */
  memo: z.string().max(500).optional(),
  /** バックオーダー状態（レスポンス専用） */
  backordered: z.boolean().optional(),
})

export type ShipmentItem = z.infer<typeof ShipmentItemSchema>

/**
 * 国内配送の受取人情報
 */
export const DomesticRecipientInfoSchema = z
  .object({
    /** 郵便番号 (required, pattern: 7-8 digits, with optional hyphen) */
    postcode: z
      .string()
      .regex(
        /^\d{3}-?\d{4}$/,
        '郵便番号は7桁の数字である必要があります（例: 1700013 または 170-0013）',
      ),
    /** 都道府県 (required) */
    prefecture: z.string().min(1, '都道府県は必須です'),
    /** 住所1 (required, <= 64 chars) */
    address1: z.string().min(1, '住所1は必須です').max(64, '住所1は64文字以内である必要があります'),
    /** 住所2 (optional, <= 64 chars) */
    address2: z.string().max(64, '住所2は64文字以内である必要があります').optional(),
    /** 名前 (required, <= 15 chars) */
    name: z.string().min(1, '名前は必須です').max(15, '名前は15文字以内である必要があります'),
    /** 会社名 (optional, <= 16 chars) */
    company: z.string().max(16, '会社名は16文字以内である必要があります').optional(),
    /** 部署名 (optional, <= 255 chars) */
    division: z.string().max(255, '部署名は255文字以内である必要があります').optional(),
    /** 電話番号 (optional, 10-13 chars) */
    phone: z
      .string()
      .min(10, '電話番号は10文字以上である必要があります')
      .max(13, '電話番号は13文字以内である必要があります')
      .optional(),
  })
  .refine(
    (data) => {
      // address1 + address2 combined must be <= 64 characters
      const combinedLength = data.address1.length + (data.address2?.length ?? 0)
      return combinedLength <= 64
    },
    {
      message: 'address1とaddress2の合計文字数は64文字以内である必要があります',
      path: ['address2'],
    },
  )

export type DomesticRecipientInfo = z.infer<typeof DomesticRecipientInfoSchema>

/**
 * 国際配送の受取人情報
 */
export const InternationalRecipientInfoSchema = z.object({
  /** 国コード (required, pattern: 2-3 uppercase letters) */
  region_code: z
    .string()
    .regex(/^[A-Z]{2,3}$/, '国コードは2-3文字の大文字アルファベットである必要があります'),
  /** 郵便番号 (required, <= 10 chars) */
  postcode: z
    .string()
    .min(1, '郵便番号は必須です')
    .max(10, '郵便番号は10文字以内である必要があります'),
  /** 都市名 (required, <= 100 chars) */
  city: z.string().min(1, '都市名は必須です').max(100, '都市名は100文字以内である必要があります'),
  /** 住所 (required, <= 255 chars) - Note: use 'address' not 'address1' */
  address: z.string().min(1, '住所は必須です').max(255, '住所は255文字以内である必要があります'),
  /** 名前 (required, <= 255 chars) */
  name: z.string().min(1, '名前は必須です').max(255, '名前は255文字以内である必要があります'),
  /** 電話番号 (required, <= 40 chars) */
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .max(40, '電話番号は40文字以内である必要があります'),
  /** 会社名 (optional) */
  company: z.string().optional(),
  /** 部署名 (optional) */
  division: z.string().optional(),
})

export type InternationalRecipientInfo = z.infer<typeof InternationalRecipientInfoSchema>

/**
 * 受取人情報（国内/国際の統合型 - リクエスト用）
 */
export const RecipientInfoSchema = z.union([
  DomesticRecipientInfoSchema,
  InternationalRecipientInfoSchema,
])

export type RecipientInfo = z.infer<typeof RecipientInfoSchema>

/**
 * 受取人情報（レスポンス用 - 柔軟なスキーマ）
 */
export const RecipientInfoResponseSchema = z.object({
  /** 郵便番号 */
  postcode: z.string().optional(),
  /** 都道府県 */
  prefecture: z.string().optional(),
  /** 住所1 */
  address1: z.string().optional(),
  /** 住所2 */
  address2: z.string().optional(),
  /** 名前 */
  name: z.string().optional(),
  /** 会社名 */
  company: z.string().optional(),
  /** 部署名 */
  division: z.string().optional(),
  /** 電話番号 */
  phone: z.string().optional(),
  /** 国コード（国際配送の場合） */
  region_code: z.string().optional(),
  /** 都市名（国際配送の場合） */
  city: z.string().optional(),
  /** 住所（国際配送の場合） */
  address: z.string().optional(),
})

export type RecipientInfoResponse = z.infer<typeof RecipientInfoResponseSchema>

/**
 * 国内配送の送り主情報
 */
export const DomesticSenderInfoSchema = z.object({
  /** 郵便番号 (required, pattern: 7 digits, with optional hyphen) */
  postcode: z
    .string()
    .regex(
      /^\d{3}-?\d{4}$/,
      '郵便番号は7桁の数字である必要があります（例: 1700013 または 170-0013）',
    ),
  /** 都道府県 (required) */
  prefecture: z.string().min(1, '都道府県は必須です'),
  /** 住所1 (required, <= 64 chars) */
  address1: z.string().min(1, '住所1は必須です').max(64, '住所1は64文字以内である必要があります'),
  /** 住所2 (optional, <= 64 chars) */
  address2: z.string().max(64, '住所2は64文字以内である必要があります').optional(),
  /** 名前 (required, <= 15 chars) */
  name: z.string().min(1, '名前は必須です').max(15, '名前は15文字以内である必要があります'),
  /** 会社名 (optional, <= 16 chars) */
  company: z.string().max(16, '会社名は16文字以内である必要があります').optional(),
  /** 部署名 (optional, <= 255 chars) */
  division: z.string().max(255, '部署名は255文字以内である必要があります').optional(),
  /** 電話番号 (optional, <= 20 chars) */
  phone: z.string().max(20, '電話番号は20文字以内である必要があります').optional(),
})

export type DomesticSenderInfo = z.infer<typeof DomesticSenderInfoSchema>

/**
 * 国際配送の送り主情報
 */
export const InternationalSenderInfoSchema = z.object({
  /** 郵便番号 (required) */
  postcode: z.string().min(1, '郵便番号は必須です'),
  /** 都道府県 (required, <= 9 chars for international) */
  prefecture: z
    .string()
    .min(1, '都道府県は必須です')
    .max(9, '都道府県は9文字以内である必要があります'),
  /** 住所1 (required, <= 64 chars) */
  address1: z.string().min(1, '住所1は必須です').max(64, '住所1は64文字以内である必要があります'),
  /** 住所2 (optional, <= 64 chars) */
  address2: z.string().max(64, '住所2は64文字以内である必要があります').optional(),
  /** 名前 (required, <= 255 chars for international) */
  name: z.string().min(1, '名前は必須です').max(255, '名前は255文字以内である必要があります'),
  /** 会社名 (required, <= 255 chars) */
  company: z
    .string()
    .min(1, '会社名は必須です')
    .max(255, '会社名は255文字以内である必要があります'),
  /** 部署名 (optional, <= 255 chars) */
  division: z.string().max(255, '部署名は255文字以内である必要があります').optional(),
  /** 電話番号 (required, <= 20 chars for international) */
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .max(20, '電話番号は20文字以内である必要があります'),
})

export type InternationalSenderInfo = z.infer<typeof InternationalSenderInfoSchema>

/**
 * 送り主情報（国内/国際の統合型 - リクエスト用）
 */
export const SenderInfoSchema = z.union([DomesticSenderInfoSchema, InternationalSenderInfoSchema])

export type SenderInfo = z.infer<typeof SenderInfoSchema>

/**
 * 送り主情報（レスポンス用 - 柔軟なスキーマ）
 */
export const SenderInfoResponseSchema = z.object({
  /** 郵便番号 */
  postcode: z.string().optional(),
  /** 都道府県 */
  prefecture: z.string().optional(),
  /** 住所1 */
  address1: z.string().optional(),
  /** 住所2 */
  address2: z.string().optional(),
  /** 名前 */
  name: z.string().optional(),
  /** 会社名 */
  company: z.string().optional(),
  /** 部署名 */
  division: z.string().optional(),
  /** 電話番号 */
  phone: z.string().optional(),
})

export type SenderInfoResponse = z.infer<typeof SenderInfoResponseSchema>

/**
 * 配送オプション
 */
export const DeliveryOptionsSchema = z.object({
  /** 宅配ボックス配送 */
  box_delivery: z.boolean().optional(),
  /** 壊れ物 */
  fragile_item: z.boolean().optional(),
})

export type DeliveryOptions = z.infer<typeof DeliveryOptionsSchema>

/**
 * Validates recipient and sender information based on the international flag.
 * This validator is shared between CreateShipmentRequestSchema and UpdateShipmentRequestSchema.
 *
 * @param data - The data to validate containing international flag, recipient, and sender
 * @param ctx - The Zod refinement context for adding validation issues
 */
function validateShipmentAddresses(
  data: {
    international?: boolean | undefined
    recipient?: unknown
    sender?: unknown
    [key: string]: unknown
  },
  ctx: z.RefinementCtx,
): void {
  const isInternational = data.international === true

  // Validate recipient based on international flag (only if provided)
  if (data.recipient !== undefined) {
    const schema = isInternational ? InternationalRecipientInfoSchema : DomesticRecipientInfoSchema
    const result = schema.safeParse(data.recipient)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['recipient', ...issue.path],
        })
      })
    }
  }

  // Validate sender based on international flag (only if provided)
  if (data.sender !== undefined) {
    const schema = isInternational ? InternationalSenderInfoSchema : DomesticSenderInfoSchema
    const result = schema.safeParse(data.sender)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['sender', ...issue.path],
        })
      })
    }
  }
}

/**
 * 出荷作成リクエストのベーススキーマ
 */
const CreateShipmentRequestBaseSchema = z.object({
  /** 識別子（order_noがnullの場合必須、1-100文字） */
  identifier: z.string().min(1).max(100).optional(),
  /** 注文番号（identifierがnullの場合必須、1-100文字） */
  order_no: z.string().min(1).max(100).optional(),

  // 送り主・受取人情報
  /** 送り主情報 */
  sender: z.record(z.unknown()).optional(),
  /** 受取人情報 */
  recipient: z.record(z.unknown()),

  // 金額関連
  /** 小計金額 */
  subtotal_amount: z.number().int().optional(),
  /** 配送料 */
  delivery_charge: z.number().int().optional(),
  /** 手数料 */
  handling_charge: z.number().int().optional(),
  /** 割引金額 */
  discount_amount: z.number().int().optional(),
  /** 合計金額 */
  total_amount: z.number().int().optional(),
  /** 税額（最大999999999） */
  tax: z.number().int().max(999999999).optional(),
  /** 合計（通常税率10%） */
  total_with_normal_tax: z.number().int().optional(),
  /** 合計（軽減税率8%） */
  total_with_reduced_tax: z.number().int().optional(),
  /** 税込みフラグ */
  tax_included: z.boolean().optional(),
  /** 納税者番号（2-30文字） */
  tax_number: z.string().min(2).max(30).optional(),

  // 配送関連
  /** 配送業者 */
  delivery_carrier: DeliveryCarrierSchema.optional(),
  /** 配送時間帯 */
  delivery_time_slot: DeliveryTimeSlotSchema.optional(),
  /** 配送希望日 */
  delivery_date: DateStringSchema.optional(),
  /** 配送方法 */
  delivery_method: DeliveryMethodSchema.optional(),
  /** 配送オプション */
  delivery_options: DeliveryOptionsSchema.optional(),
  /** 配送サービス */
  delivery_service: DeliveryServiceSchema.optional(),

  // 代金引換
  /** 代金引換フラグ */
  cash_on_delivery: z.boolean().optional(),
  /** 代金引換合計金額（最大999999999） */
  total_for_cash_on_delivery: z.number().int().max(999999999).optional(),
  /** 代金引換税額（最大999999999） */
  tax_for_cash_on_delivery: z.number().int().max(999999999).optional(),

  // 国際発送
  /** 海外発送フラグ */
  international: z.boolean().default(false).optional(),
  /** 通貨コード */
  currency_code: z.string().optional(),
  /** 損害保険制度の加入希望 */
  insurance: z.boolean().optional(),
  /** 輸出目的 */
  purpose: PurposeSchema.optional(),
  /** 関税支払い済み */
  duty_paid: z.boolean().optional(),
  /** VAT番号 */
  vat_number: z.string().optional(),
  /** EORI番号 */
  eori_number: z.string().optional(),
  /** 委任状 */
  letter_of_attorney: z.boolean().optional(),

  // 倉庫・在庫
  /** 倉庫コード */
  warehouse: z.string().optional(),
  /** 在庫不足時の出荷予約フラグ */
  backorder_if_unavailable: z.boolean().default(false).optional(),
  /** 引当優先度（0-100） */
  allocate_priority: z.number().int().min(0).max(100).optional(),
  /** 出荷ルール適用フラグ */
  apply_rule: z.boolean().optional(),

  // その他
  /** 割当出荷日 */
  assigned_shipping_date: DateStringSchema.optional(),
  /** FBA出荷ID */
  fba_shipment_id: z.string().optional(),
  /** 伝票備考 */
  label_note: z.string().optional(),
  /** 同梱配送ラベル */
  bundle_shipping_label: z.string().optional(),

  // 既存フィールド
  /** 緩衝材単位 */
  cushioning_unit: CushioningUnitSchema.optional(),
  /** 緩衝材タイプ */
  cushioning_type: CushioningTypeSchema.optional(),
  /** ギフトラッピング単位 */
  gift_wrapping_unit: GiftWrappingUnitSchema.optional(),
  /** ギフトラッピングタイプ */
  gift_wrapping_type: GiftWrappingTypeSchema.optional(),
  /** ギフト送り主名 */
  gift_sender_name: z.string().max(100).optional(),
  /** 同梱商品リスト（1-5個、unique） */
  bundled_items: z
    .array(z.string())
    .min(1)
    .max(5)
    .optional()
    .refine((items) => items === undefined || new Set(items).size === items.length, {
      message: 'bundled_items must contain unique values',
    }),
  /** 出荷通知メールアドレス */
  shipping_email: EmailSchema.optional(),
  /** 納品書タイプ */
  delivery_note_type: DeliveryNoteTypeSchema.optional(),
  /** 納品書に価格を表示 */
  price_on_delivery_note: z.boolean().optional(),
  /** メッセージ（最大500文字） */
  message: z.string().max(500).optional(),
  /** 保留フラグ（デフォルト: false） */
  suspend: z.boolean().default(false).optional(),
  /** 出荷予定日 */
  shipping_date: DateStringSchema.optional(),
  /** 出荷商品リスト（必須） */
  items: z.array(ShipmentItemSchema).min(1),
})

/**
 * 出荷作成リクエストのスキーマ
 */
export const CreateShipmentRequestSchema = CreateShipmentRequestBaseSchema.refine(
  (data) => data.identifier !== undefined || data.order_no !== undefined,
  {
    message: 'identifierまたはorder_noのいずれかを指定してください',
    path: ['identifier'],
  },
).superRefine(validateShipmentAddresses)

export type CreateShipmentRequest = z.infer<typeof CreateShipmentRequestSchema>

/**
 * 出荷更新リクエストのスキーマ
 */
export const UpdateShipmentRequestSchema = CreateShipmentRequestBaseSchema.partial()
  .extend({
    /** 出荷商品リスト（更新時もitemsを変更する場合は全件指定） */
    items: z.array(ShipmentItemSchema).min(1).optional(),
  })
  .superRefine(validateShipmentAddresses)

export type UpdateShipmentRequest = z.infer<typeof UpdateShipmentRequestSchema>

/**
 * 出荷ステータス
 */
export const ShipmentStatusSchema = z.enum([
  'PENDING', // 出荷待ち
  'SUSPENDED', // 保留中
  'PICKING', // ピッキング中
  'PACKING', // 梱包中
  'READY', // 出荷準備完了
  'SHIPPED', // 出荷済み
  'DELIVERED', // 配達完了
  'CANCELLED', // キャンセル
  'RETURNED', // 返品
])

export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>

/**
 * 配送業者情報
 */
export const CarrierInfoSchema = z.object({
  /** 配送業者コード */
  carrier_code: z.string(),
  /** 配送業者名 */
  carrier_name: z.string(),
  /** 追跡番号 */
  tracking_no: z.string(),
  /** 追跡URL */
  tracking_url: z.string().url().optional(),
})

export type CarrierInfo = z.infer<typeof CarrierInfoSchema>

/**
 * 出荷レスポンスのスキーマ
 */
export const ShipmentResponseSchema = z.object({
  /** 出荷ID */
  id: z.string(),
  /** 識別子 */
  identifier: z.string().optional(),
  /** 注文番号 */
  order_no: z.string().optional(),

  // 送り主・受取人情報
  /** 送り主情報 */
  sender: SenderInfoResponseSchema.optional(),
  /** 受取人情報 */
  recipient: RecipientInfoResponseSchema.optional(),

  // 金額関連
  /** 小計金額 */
  subtotal_amount: z.number().int().optional(),
  /** 配送料 */
  delivery_charge: z.number().int().optional(),
  /** 手数料 */
  handling_charge: z.number().int().optional(),
  /** 割引金額 */
  discount_amount: z.number().int().optional(),
  /** 合計金額 */
  total_amount: z.number().int().optional(),
  /** 税額 */
  tax: z.number().int().optional(),
  /** 合計（通常税率10%） */
  total_with_normal_tax: z.number().int().optional(),
  /** 合計（軽減税率8%） */
  total_with_reduced_tax: z.number().int().optional(),
  /** 税込みフラグ */
  tax_included: z.boolean().optional(),
  /** 納税者番号 */
  tax_number: z.string().optional(),

  // 配送関連
  /** 配送業者 */
  delivery_carrier: DeliveryCarrierSchema.optional(),
  /** 配送時間帯 */
  delivery_time_slot: DeliveryTimeSlotSchema.optional(),
  /** 配送希望日 */
  delivery_date: z.string().optional(),
  /** 配送方法 */
  delivery_method: DeliveryMethodSchema.optional(),
  /** 配送オプション */
  delivery_options: DeliveryOptionsSchema.optional(),
  /** 配送サービス */
  delivery_service: DeliveryServiceSchema.optional(),

  // 代金引換
  /** 代金引換フラグ */
  cash_on_delivery: z.boolean().optional(),
  /** 代金引換合計金額 */
  total_for_cash_on_delivery: z.number().int().optional(),
  /** 代金引換税額 */
  tax_for_cash_on_delivery: z.number().int().optional(),

  // 国際発送
  /** 海外発送フラグ */
  international: z.boolean().optional(),
  /** 通貨コード */
  currency_code: z.string().optional(),
  /** 損害保険制度の加入希望 */
  insurance: z.boolean().optional(),
  /** 輸出目的 */
  purpose: PurposeSchema.optional(),
  /** 関税支払い済み */
  duty_paid: z.boolean().optional(),
  /** VAT番号 */
  vat_number: z.string().optional(),
  /** EORI番号 */
  eori_number: z.string().optional(),
  /** 委任状 */
  letter_of_attorney: z.boolean().optional(),

  // 倉庫・在庫
  /** 倉庫コード */
  warehouse: z.string().optional(),
  /** 在庫不足時の出荷予約フラグ */
  backorder_if_unavailable: z.boolean().optional(),
  /** 引当優先度 */
  allocate_priority: z.number().int().optional(),
  /** 出荷ルール適用フラグ */
  apply_rule: z.boolean().optional(),

  // その他
  /** 割当出荷日 */
  assigned_shipping_date: z.string().optional(),
  /** FBA出荷ID */
  fba_shipment_id: z.string().optional(),
  /** 伝票備考 */
  label_note: z.string().optional(),
  /** 同梱配送ラベル */
  bundle_shipping_label: z.string().optional(),

  // 既存フィールド
  /** 緩衝材単位 */
  cushioning_unit: CushioningUnitSchema.optional(),
  /** 緩衝材タイプ */
  cushioning_type: CushioningTypeSchema.optional(),
  /** ギフトラッピング単位 */
  gift_wrapping_unit: GiftWrappingUnitSchema.optional(),
  /** ギフトラッピングタイプ */
  gift_wrapping_type: GiftWrappingTypeSchema.optional(),
  /** ギフト送り主名 */
  gift_sender_name: z.string().optional(),
  /** 同梱商品リスト */
  bundled_items: z.array(z.string()).optional(),
  /** 出荷通知メールアドレス */
  shipping_email: z.string().optional(),
  /** 納品書タイプ */
  delivery_note_type: DeliveryNoteTypeSchema.optional(),
  /** 納品書に価格を表示 */
  price_on_delivery_note: z.boolean().optional(),
  /** メッセージ */
  message: z.string().optional(),
  /** 保留フラグ */
  suspend: z.boolean().optional(),
  /** 出荷予定日 */
  shipping_date: z.string().optional(),

  // レスポンス専用フィールド
  /** 返品フラグ */
  shipment_return: z.boolean().optional(),
  /** 割当温度帯 */
  assigned_temperature_zone: z.string().optional(),
  /** 出荷日時 */
  shipped_at: z.string().optional(),
  /** 追跡コード */
  tracking_code: z.string().optional(),
  /** 追跡コード配列 */
  tracking_codes: z.array(z.string()).optional(),
  /** URL */
  url: z.string().optional(),
  /** パッケージ数量 */
  package_quantity: z.number().int().optional(),
  /** パッケージ情報 */
  packages: z.array(z.unknown()).optional(),
  /** ケース情報 */
  cases: z.unknown().optional(),
  /** 実際の出荷日 */
  actual_shipping_date: z.string().optional(),
  /** 配達予定日 */
  estimated_delivery_date: z.string().optional(),
  /** 出荷商品リスト */
  items: z.array(
    ShipmentItemSchema.extend({
      /** 実際の出荷数量 */
      shipped_quantity: z.number().int().min(0).optional(),
    }),
  ),
  /** 配送業者情報 */
  carrier_info: CarrierInfoSchema.optional(),
  /** ステータス */
  status: ShipmentStatusSchema.optional(),
  /** 作成日時 */
  created_at: z.string().optional(),
  /** 更新日時 */
  updated_at: z.string().optional(),
  /** キャンセル日時 */
  cancelled_at: z.string().optional(),
})

export type ShipmentResponse = z.infer<typeof ShipmentResponseSchema>

/**
 * 出荷リスト取得のクエリパラメータ
 */
export const ListShipmentsQuerySchema = z.object({
  /** 出荷ID（カンマ区切りで最大100件） */
  id: z.string().min(1, 'idは1文字以上で指定してください').optional(),
})

export type ListShipmentsQuery = z.infer<typeof ListShipmentsQuerySchema>

/**
 * 出荷リストレスポンス
 */
export const ListShipmentsResponseSchema = z.object({
  /** 出荷リスト */
  shipments: z.array(ShipmentResponseSchema),
})

export type ListShipmentsResponse = z.infer<typeof ListShipmentsResponseSchema>

/**
 * 出荷実績取得のクエリパラメータ
 */
export const ListShippedShipmentsQuerySchema = z.object({
  /** 最終出荷日の範囲（YYYYMMDD形式） */
  date_before: z
    .string()
    .regex(/^\d{8}$/, 'date_beforeはYYYYMMDD形式である必要があります')
    .optional(),
  /** 初回出荷日の範囲（YYYYMMDD形式） */
  date_after: z
    .string()
    .regex(/^\d{8}$/, 'date_afterはYYYYMMDD形式である必要があります')
    .optional(),
})

export type ListShippedShipmentsQuery = z.infer<typeof ListShippedShipmentsQuerySchema>

/**
 * 出荷実績レスポンス
 */
export const ListShippedShipmentsResponseSchema = z.object({
  /** 出荷実績リスト */
  shipments: z.array(ShipmentResponseSchema),
})

export type ListShippedShipmentsResponse = z.infer<typeof ListShippedShipmentsResponseSchema>

/**
 * 国際発送の国情報
 */
export const InternationalRegionSchema = z.object({
  /** 国コード（2-3文字の大文字アルファベット） */
  code: z.string(),
  /** 国名（日本語） */
  name: z.string(),
  /** 国名（英語） */
  name_en: z.string().optional(),
})

export type InternationalRegion = z.infer<typeof InternationalRegionSchema>

/**
 * 国際発送の国情報一覧レスポンス
 */
export const InternationalRegionsResponseSchema = z.object({
  /** 国情報リスト */
  regions: z.array(InternationalRegionSchema),
})

export type InternationalRegionsResponse = z.infer<typeof InternationalRegionsResponseSchema>

/**
 * 国際発送の通貨情報
 */
export const InternationalCurrencySchema = z.object({
  /** 通貨コード（3文字の大文字アルファベット） */
  code: z.string(),
  /** 通貨名 */
  name: z.string(),
})

export type InternationalCurrency = z.infer<typeof InternationalCurrencySchema>

/**
 * 国際発送の通貨情報一覧レスポンス
 */
export const InternationalCurrenciesResponseSchema = z.object({
  /** 通貨情報リスト */
  currencies: z.array(InternationalCurrencySchema),
})

export type InternationalCurrenciesResponse = z.infer<typeof InternationalCurrenciesResponseSchema>

/**
 * 引当解除リクエスト
 * 注意: APIはリクエストボディとして空のオブジェクトを期待します
 */
export const ClearAllocationRequestSchema = z.object({})

export type ClearAllocationRequest = z.infer<typeof ClearAllocationRequestSchema>

/**
 * 出荷依頼一括作成リクエスト
 */
export const BulkShipmentRequestSchema = z.object({
  /** 出荷依頼リスト */
  shipments: z.array(CreateShipmentRequestSchema).min(1),
  /** 出荷ルール適用フラグ */
  apply_rule: z.boolean().optional(),
})

export type BulkShipmentRequest = z.infer<typeof BulkShipmentRequestSchema>

/**
 * 出荷依頼一括作成レスポンス
 */
export const BulkShipmentResponseSchema = z.object({
  /** 作成された出荷依頼リスト */
  shipments: z.array(ShipmentResponseSchema),
})

export type BulkShipmentResponse = z.infer<typeof BulkShipmentResponseSchema>

/**
 * 移動先倉庫情報
 */
export const TransferDestinationSchema = z.object({
  /** 移動先倉庫コード（必須） */
  warehouse: z.string().min(1, '移動先倉庫コードは必須です'),
})

export type TransferDestination = z.infer<typeof TransferDestinationSchema>

/**
 * 移動商品情報
 */
export const TransferItemSchema = z.object({
  /** 商品コード（必須） */
  code: z.string().min(1, '商品コードは必須です'),
  /** 数量（必須、1以上） */
  quantity: z.number().int().min(1, '数量は1以上である必要があります'),
  /** 商品名（オプショナル） */
  name: z.string().optional(),
})

export type TransferItem = z.infer<typeof TransferItemSchema>

/**
 * 倉庫移動作成リクエスト
 */
export const CreateTransferRequestSchema = z.object({
  /** 移動元倉庫コード（必須） */
  warehouse: z.string().min(1, '移動元倉庫コードは必須です'),
  /** 移動先倉庫情報（必須） */
  destination: TransferDestinationSchema,
  /** 移動商品リスト（必須、1件以上） */
  items: z.array(TransferItemSchema).min(1, '商品は1件以上指定してください'),
})

export type CreateTransferRequest = z.infer<typeof CreateTransferRequestSchema>

/**
 * 倉庫移動更新リクエスト
 */
export const UpdateTransferRequestSchema = z.object({
  /** 移動先倉庫情報（必須） */
  destination: TransferDestinationSchema,
  /** 移動商品リスト（必須、1件以上） */
  items: z.array(TransferItemSchema).min(1, '商品は1件以上指定してください'),
})

export type UpdateTransferRequest = z.infer<typeof UpdateTransferRequestSchema>

/**
 * 倉庫移動修正リクエスト
 */
export const ModifyTransferRequestSchema = z.object({
  /** 移動先倉庫情報のみ変更可能 */
  destination: TransferDestinationSchema,
})

export type ModifyTransferRequest = z.infer<typeof ModifyTransferRequestSchema>

/**
 * 倉庫移動レスポンス
 * ShipmentResponseを拡張し、移動先倉庫情報を追加
 */
export const TransferResponseSchema = ShipmentResponseSchema.extend({
  /** 移動先倉庫情報 */
  destination: z
    .object({
      /** 移動先倉庫コード */
      warehouse: z.string(),
      /** 移動先入荷依頼情報 */
      warehousing: z
        .object({
          /** 入荷依頼ID */
          id: z.string(),
        })
        .optional(),
    })
    .optional(),
})

export type TransferResponse = z.infer<typeof TransferResponseSchema>

/**
 * identifier指定の出荷依頼一覧取得クエリ
 */
export const ListShipmentsByIdentifierQuerySchema = z.object({
  /** 識別番号（カンマ区切りで最大100件） */
  identifier: z.string().min(1, '識別番号は必須です'),
})

export type ListShipmentsByIdentifierQuery = z.infer<typeof ListShipmentsByIdentifierQuerySchema>

/**
 * 出荷依頼修正リクエスト
 * OpenAPI仕様の ModifyShipmentRequest に対応
 *
 * ステータスがピッキング中・ピッキング済み・梱包済みの出荷依頼の修正を依頼します。
 * データ取り込み後の修正となりますので、別途事務手数料＋作業進捗状況による作業費用がかかります。
 *
 * @remarks
 * - パスパラメータで出荷IDを指定するため、identifierやitemsフィールドは不要です
 * - 変更可能なフィールド: recipient, delivery_time_slot, delivery_date
 * - 海外発送の場合は梱包済みのステータス以降は修正依頼ができません
 * - 作業進捗状況によっては修正依頼にお応えできない場合があります
 *
 * @example
 * ```typescript
 * const modifyData: ModifyShipmentRequest = {
 *   recipient: {
 *     name: '山田太郎',
 *     postcode: '1000002',
 *     prefecture: '東京都',
 *     address1: '千代田2-2-2',
 *     phone: '09012345678'
 *   },
 *   delivery_time_slot: 'AM',
 *   delivery_date: '2025-02-01'
 * }
 * ```
 */
export const ModifyShipmentRequestSchema = z.object({
  /** 受取人情報 */
  recipient: RecipientInfoSchema.optional(),
  /** 配送時間帯（AM, 12, 14, 16, 18, 19） */
  delivery_time_slot: DeliveryTimeSlotSchema.optional(),
  /** 配送希望日（YYYY-MM-DD形式） */
  delivery_date: DateStringSchema.optional(),
})

export type ModifyShipmentRequest = z.infer<typeof ModifyShipmentRequestSchema>
