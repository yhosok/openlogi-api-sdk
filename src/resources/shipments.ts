/**
 * Shipments API resource
 * 出荷リソースAPIの実装
 *
 * @packageDocumentation
 */

import { z } from 'zod'
import { request, type OpenLogiClient } from '../client.js'
import { ValidationError } from '../errors.js'
import {
  type CreateShipmentRequest,
  CreateShipmentRequestSchema,
  type UpdateShipmentRequest,
  UpdateShipmentRequestSchema,
  type ShipmentResponse,
  ShipmentResponseSchema,
  type ListShipmentsQuery,
  type ListShipmentsResponse,
  ListShipmentsResponseSchema,
  type ListShippedShipmentsQuery,
  type ListShippedShipmentsResponse,
  ListShippedShipmentsResponseSchema,
  type InternationalRegionsResponse,
  InternationalRegionsResponseSchema,
  type InternationalCurrenciesResponse,
  InternationalCurrenciesResponseSchema,
  type ClearAllocationRequest,
  type BulkShipmentRequest,
  BulkShipmentResponseSchema,
  type BulkShipmentResponse,
  type CreateTransferRequest,
  CreateTransferRequestSchema,
  type UpdateTransferRequest,
  UpdateTransferRequestSchema,
  type ModifyTransferRequest,
  ModifyTransferRequestSchema,
  type TransferResponse,
  TransferResponseSchema,
  type ListShipmentsByIdentifierQuery,
  ListShipmentsByIdentifierQuerySchema,
} from '../types/shipments.js'

/**
 * 出荷依頼修正リクエスト
 */
export const ShipmentModifyRequestSchema = z.object({
  /** 修正理由（必須） */
  reason: z.string().min(1).max(500),
  /** 修正内容 */
  modifications: UpdateShipmentRequestSchema,
})

export type ShipmentModifyRequest = z.infer<typeof ShipmentModifyRequestSchema>

/**
 * 出荷依頼一覧を取得
 *
 * @param client - OpenLogiクライアント
 * @param params - クエリパラメータ
 * @returns 出荷依頼一覧とページネーション情報
 *
 * @example
 * ```typescript
 * const response = await listShipments(client, {
 *   page: 1,
 *   per_page: 20,
 *   status: 'PENDING',
 * })
 * ```
 */
export async function listShipments(
  client: OpenLogiClient,
  params?: ListShipmentsQuery,
): Promise<ListShipmentsResponse> {
  return request(client, ListShipmentsResponseSchema, 'shipments', {
    method: 'GET',
    searchParams: params as Record<string, string | number | boolean>,
  })
}

/**
 * 出荷依頼を作成
 *
 * Note: Request validation is performed upfront to provide clear error messages
 * for domestic/international field requirements before sending to the API.
 * This includes validation of recipient/sender fields based on the international flag.
 *
 * @param client - OpenLogiクライアント
 * @param data - 出荷依頼データ
 * @returns 作成された出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await createShipment(client, {
 *   order_no: 'ORDER-001',
 *   items: [
 *     { code: 'ITEM-001', quantity: 1 },
 *   ],
 *   delivery_info: {
 *     name: '山田太郎',
 *     postal_code: '1000001',
 *     prefecture: '東京都',
 *     city: '千代田区',
 *     address1: '千代田1-1-1',
 *     phone: '09012345678',
 *   },
 * })
 * ```
 */
export async function createShipment(
  client: OpenLogiClient,
  data: CreateShipmentRequest,
): Promise<ShipmentResponse> {
  // Validate request data before sending
  const result = CreateShipmentRequestSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ShipmentResponseSchema, 'shipments', {
    method: 'POST',
    json: result.data,
  })
}

/**
 * 出荷依頼を一括作成
 *
 * @param client - OpenLogiクライアント
 * @param data - 一括作成データ
 * @returns 一括作成結果
 *
 * @example
 * ```typescript
 * const result = await bulkCreateShipments(client, {
 *   shipments: [
 *     {
 *       order_no: 'ORDER-001',
 *       items: [{ code: 'ITEM-001', quantity: 1 }],
 *       delivery_info: { ... },
 *     },
 *     {
 *       order_no: 'ORDER-002',
 *       items: [{ code: 'ITEM-002', quantity: 2 }],
 *       delivery_info: { ... },
 *     },
 *   ],
 * })
 * ```
 */
export async function bulkCreateShipments(
  client: OpenLogiClient,
  data: BulkShipmentRequest,
): Promise<BulkShipmentResponse> {
  return request(client, BulkShipmentResponseSchema, 'shipments/bulk', {
    method: 'POST',
    json: data,
  })
}

/**
 * 出荷依頼情報を取得
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷依頼ID
 * @returns 出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await getShipment(client, '12345')
 * ```
 */
export async function getShipment(client: OpenLogiClient, id: string): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${id}`, {
    method: 'GET',
  })
}

/**
 * 出荷依頼を更新
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷依頼ID
 * @param data - 更新データ
 * @returns 更新された出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await updateShipment(client, '12345', {
 *   shipping_date: '2025-01-25',
 * })
 * ```
 */
export async function updateShipment(
  client: OpenLogiClient,
  id: string,
  data: UpdateShipmentRequest,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${id}`, {
    method: 'PUT',
    json: data,
  })
}

/**
 * 出荷依頼を削除
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷依頼ID
 *
 * @example
 * ```typescript
 * await deleteShipment(client, '12345')
 * ```
 */
export async function deleteShipment(client: OpenLogiClient, id: string): Promise<void> {
  await request(client, z.void(), `shipments/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 出荷依頼を修正
 *
 * 既に処理中の出荷依頼に対して修正を加える場合に使用します。
 * 単純な更新とは異なり、修正理由が必要です。
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷依頼ID
 * @param data - 修正データ
 * @returns 修正された出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await modifyShipment(client, '12345', {
 *   reason: '配送先住所の誤りを修正',
 *   modifications: {
 *     delivery_info: {
 *       name: '山田太郎',
 *       postal_code: '1000002',
 *       prefecture: '東京都',
 *       city: '千代田区',
 *       address1: '千代田2-2-2',
 *       phone: '09012345678',
 *     },
 *   },
 * })
 * ```
 */
export async function modifyShipment(
  client: OpenLogiClient,
  id: string,
  data: ShipmentModifyRequest,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${id}/modify`, {
    method: 'POST',
    json: data,
  })
}

/**
 * 出荷依頼をキャンセル
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷依頼ID
 * @returns キャンセルされた出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await cancelShipment(client, '12345')
 * ```
 */
export async function cancelShipment(
  client: OpenLogiClient,
  id: string,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${id}/cancel`, {
    method: 'POST',
    json: {},
  })
}

/**
 * 出荷実績一覧を取得
 *
 * 指定日付の直近1日分の出荷実績（出荷済みの出荷依頼）を取得します。
 * クエリパラメータを指定しない場合は、リクエスト日の直近1日分の出荷実績を取得します。
 *
 * @param client - OpenLogiクライアント
 * @param query - クエリパラメータ（オプショナル）
 * @returns 出荷実績リスト
 *
 * @example
 * ```typescript
 * // 直近の出荷実績を取得
 * const response = await listShippedShipments(client)
 *
 * // 特定期間の出荷実績を取得
 * const response = await listShippedShipments(client, {
 *   date_before: '20190320',
 *   date_after: '20190420',
 * })
 * ```
 */
export async function listShippedShipments(
  client: OpenLogiClient,
  query?: ListShippedShipmentsQuery,
): Promise<ListShippedShipmentsResponse> {
  return request(client, ListShippedShipmentsResponseSchema, 'shipments/shipped', {
    method: 'GET',
    searchParams: query as Record<string, string | number | boolean>,
  })
}

/**
 * 指定年月日の出荷実績を取得
 *
 * @param client - OpenLogiクライアント
 * @param year - 年（4桁）
 * @param month - 月（1-12）
 * @param day - 日（1-31）
 * @returns 出荷実績リスト
 *
 * @example
 * ```typescript
 * const response = await getShippedShipmentByDate(client, 2025, 1, 20)
 * ```
 */
export async function getShippedShipmentByDate(
  client: OpenLogiClient,
  year: number,
  month: number,
  day: number,
): Promise<ListShippedShipmentsResponse> {
  return request(
    client,
    ListShippedShipmentsResponseSchema,
    `shipments/shipped/${year}/${month}/${day}`,
    {
      method: 'GET',
    },
  )
}

/**
 * 国際発送の国コード情報を取得
 *
 * 海外発送指定時に指定できる国コードの一覧を取得します。
 *
 * @param client - OpenLogiクライアント
 * @returns 国コード情報リスト
 *
 * @example
 * ```typescript
 * const response = await getInternationalRegions(client)
 * console.log(response.regions) // [{ code: 'US', name: 'アメリカ合衆国', ... }, ...]
 * ```
 */
export async function getInternationalRegions(
  client: OpenLogiClient,
): Promise<InternationalRegionsResponse> {
  return request(
    client,
    InternationalRegionsResponseSchema,
    'shipments/international/regions/ems',
    {
      method: 'GET',
    },
  )
}

/**
 * 国際発送の通貨情報を取得
 *
 * 海外発送時に指定できる通貨の一覧を取得します。
 *
 * @param client - OpenLogiクライアント
 * @returns 通貨情報リスト
 *
 * @example
 * ```typescript
 * const response = await getInternationalCurrencies(client)
 * console.log(response.currencies) // [{ code: 'USD', name: '米ドル' }, ...]
 * ```
 */
export async function getInternationalCurrencies(
  client: OpenLogiClient,
): Promise<InternationalCurrenciesResponse> {
  return request(
    client,
    InternationalCurrenciesResponseSchema,
    'shipments/international/currencies',
    {
      method: 'GET',
    },
  )
}

/**
 * 出荷商品の引当解除
 *
 * 対象の出荷依頼に含まれる全ての商品から引当が解除され在庫が入荷待ちに変更されます。
 * 解除実行後は引当復旧処理が行われず、再入荷待ちの出荷依頼から引当処理が行われます。
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷依頼ID
 * @param data - 引当解除リクエスト（オプショナル）
 * @returns 更新された出荷依頼情報
 *
 * @example
 * ```typescript
 * // 基本的な使用法
 * const shipment = await clearShipmentAllocation(client, '12345')
 *
 * // 理由を指定する場合
 * const shipment = await clearShipmentAllocation(client, '12345', {
 *   reason: '在庫調整のため引当を解除',
 * })
 * ```
 */
export async function clearShipmentAllocation(
  client: OpenLogiClient,
  id: string,
  data?: ClearAllocationRequest,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/allocation/${id}/clear`, {
    method: 'POST',
    json: data ?? {},
  })
}

/**
 * 倉庫移動を作成
 *
 * 指定商品の倉庫移動依頼をします。
 * 発送元住所、発送先住所は指定された倉庫の住所となります。
 * 通常出荷と同じ出荷依頼情報が作成され、同時に発送先倉庫での入荷依頼が作成されます。
 *
 * @param client - OpenLogiクライアント
 * @param data - 倉庫移動作成データ
 * @returns 作成された倉庫移動情報
 *
 * @example
 * ```typescript
 * const transfer = await createTransfer(client, {
 *   warehouse: 'BASE2',
 *   destination: { warehouse: 'BASE3' },
 *   items: [
 *     { code: 'item-001', quantity: 1, name: '勇者の盾' }
 *   ]
 * })
 * ```
 */
export async function createTransfer(
  client: OpenLogiClient,
  data: CreateTransferRequest,
): Promise<TransferResponse> {
  // Validate request data before sending
  const result = CreateTransferRequestSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, TransferResponseSchema, 'shipments/transfer', {
    method: 'POST',
    json: result.data,
  })
}

/**
 * 倉庫移動を更新
 *
 * ステータスによっては更新できません。
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷ID
 * @param data - 更新データ
 * @returns 更新された倉庫移動情報
 *
 * @example
 * ```typescript
 * const transfer = await updateTransfer(client, 'TS001-S000001', {
 *   destination: { warehouse: 'BASE4' },
 *   items: [{ code: 'item-002', quantity: 2 }]
 * })
 * ```
 */
export async function updateTransfer(
  client: OpenLogiClient,
  id: string,
  data: UpdateTransferRequest,
): Promise<TransferResponse> {
  // Validate request data before sending
  const result = UpdateTransferRequestSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, TransferResponseSchema, `shipments/transfer/${id}`, {
    method: 'PUT',
    json: result.data,
  })
}

/**
 * 倉庫移動の修正を依頼
 *
 * ステータスがピッキング中になっている倉庫移動依頼の修正を依頼します。
 * データ取り込み後の修正となりますので、別途事務手数料＋作業進捗状況による作業費用がかかります。
 * また、作業進捗状況によってはご依頼にお応えすることができない場合がございます。
 * ご了承の上ご利用ください。
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷ID
 * @param data - 修正データ
 * @returns 修正された倉庫移動情報
 *
 * @example
 * ```typescript
 * const transfer = await modifyTransfer(client, 'TS001-S000001', {
 *   destination: { warehouse: 'BASE5' }
 * })
 * ```
 */
export async function modifyTransfer(
  client: OpenLogiClient,
  id: string,
  data: ModifyTransferRequest,
): Promise<TransferResponse> {
  // Validate request data before sending
  const result = ModifyTransferRequestSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, TransferResponseSchema, `shipments/transfer/${id}/modify`, {
    method: 'POST',
    json: result.data,
  })
}

/**
 * 倉庫移動のキャンセルを依頼
 *
 * ステータスがピッキング中になっている倉庫移動依頼のキャンセルを依頼します。
 * データ取り込み後のキャンセルとなりますので、別途事務手数料＋作業進捗状況による作業費用がかかります。
 * また、作業進捗状況によってはご依頼にお応えすることができない場合がございます。
 * ご了承の上ご利用ください。
 *
 * @param client - OpenLogiクライアント
 * @param id - 出荷ID
 * @returns キャンセルされた倉庫移動情報
 *
 * @example
 * ```typescript
 * const transfer = await cancelTransfer(client, 'TS001-S000001')
 * ```
 */
export async function cancelTransfer(
  client: OpenLogiClient,
  id: string,
): Promise<TransferResponse> {
  return request(client, TransferResponseSchema, `shipments/transfer/${id}/cancel`, {
    method: 'POST',
    json: {},
  })
}

/**
 * アカウントIDとidentifierで出荷依頼一覧を取得
 *
 * 依頼中（statusがshipped以外）の出荷依頼を取得します。
 * クエリパラメータで識別番号を指定した場合は、出荷済み（statusがshipped）の出荷依頼も取得します。
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントコード
 * @param query - クエリパラメータ（識別番号）
 * @returns 出荷依頼一覧
 *
 * @example
 * ```typescript
 * const response = await listShipmentsByAccountId(client, 'TS001', {
 *   identifier: '2015-00001,2015-00002'
 * })
 * ```
 */
export async function listShipmentsByAccountId(
  client: OpenLogiClient,
  accountId: string,
  query: ListShipmentsByIdentifierQuery,
): Promise<ListShipmentsResponse> {
  // Validate query parameters
  const result = ListShipmentsByIdentifierQuerySchema.safeParse(query)
  if (!result.success) {
    throw new ValidationError(
      `クエリパラメータの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ListShipmentsResponseSchema, `shipments/${accountId}`, {
    method: 'GET',
    searchParams: result.data as Record<string, string | number | boolean>,
  })
}

/**
 * アカウントIDとidentifierで出荷依頼を取得
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントコード
 * @param identifier - 識別番号
 * @returns 出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await getShipmentByAccountId(client, 'TS001', '2015-00001')
 * ```
 */
export async function getShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${accountId}/${identifier}`, {
    method: 'GET',
  })
}

/**
 * アカウントIDとidentifierで出荷依頼を更新
 *
 * ステータスによっては更新できません。
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントコード
 * @param identifier - 識別番号
 * @param data - 更新データ
 * @returns 更新された出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await updateShipmentByAccountId(client, 'TS001', '2015-00001', {
 *   shipping_date: '2025-01-25'
 * })
 * ```
 */
export async function updateShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
  data: UpdateShipmentRequest,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${accountId}/${identifier}`, {
    method: 'PUT',
    json: data,
  })
}

/**
 * アカウントIDとidentifierで出荷依頼を削除
 *
 * ステータスによっては削除できません。
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントコード
 * @param identifier - 識別番号
 *
 * @example
 * ```typescript
 * await deleteShipmentByAccountId(client, 'TS001', '2015-00001')
 * ```
 */
export async function deleteShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
): Promise<void> {
  await request(client, z.void(), `shipments/${accountId}/${identifier}`, {
    method: 'DELETE',
  })
}

/**
 * アカウントIDとidentifierで出荷依頼の修正を依頼
 *
 * ステータスがピッキング中・ピッキング済み・梱包済みの出荷依頼の修正を依頼します。
 * データ取り込み後の修正となりますので、別途事務手数料＋作業進捗状況による作業費用がかかります。
 * 海外発送の場合は梱包済みのステータス以降は依頼ができません。
 * キャンセル依頼を出していただき、別途新規の出荷依頼を作成してください。
 * また、作業進捗状況によってはご依頼にお応えすることができない場合がございます。
 * ご了承の上ご利用ください。
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントコード
 * @param identifier - 識別番号
 * @param data - 修正データ
 * @returns 修正された出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await modifyShipmentByAccountId(client, 'TS001', '2015-00001', {
 *   reason: '配送先住所の誤りを修正',
 *   modifications: {
 *     recipient: {
 *       name: '山田太郎',
 *       postcode: '1000002',
 *       prefecture: '東京都',
 *       address1: '千代田2-2-2',
 *       phone: '09012345678'
 *     }
 *   }
 * })
 * ```
 */
export async function modifyShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
  data: ShipmentModifyRequest,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${accountId}/${identifier}/modify`, {
    method: 'POST',
    json: data,
  })
}

/**
 * アカウントIDとidentifierで出荷依頼のキャンセルを依頼
 *
 * ステータスがピッキング中・ピッキング済み・梱包済みの出荷依頼のキャンセルを依頼します。
 * データ取り込み後のキャンセルとなりますので、別途事務手数料＋作業進捗状況による作業費用がかかります。
 * 海外発送の場合は梱包済みのステータス以降は依頼ができません。
 * また、作業進捗状況によってはご依頼にお応えすることができない場合がございます。
 * ご了承の上ご利用ください。
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントコード
 * @param identifier - 識別番号
 * @returns キャンセルされた出荷依頼情報
 *
 * @example
 * ```typescript
 * const shipment = await cancelShipmentByAccountId(client, 'TS001', '2015-00001')
 * ```
 */
export async function cancelShipmentByAccountId(
  client: OpenLogiClient,
  accountId: string,
  identifier: string,
): Promise<ShipmentResponse> {
  return request(client, ShipmentResponseSchema, `shipments/${accountId}/${identifier}/cancel`, {
    method: 'POST',
    json: {},
  })
}
