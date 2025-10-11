/**
 * Warehousings API resource
 * 入荷リソースAPIの実装
 *
 * @packageDocumentation
 */

import { z } from 'zod'
import { request, type OpenLogiClient } from '../client.js'
import {
  type CreateWarehousingRequest,
  type UpdateWarehousingRequest,
  type WarehousingResponse,
  WarehousingResponseSchema,
  type ListWarehousingResponse,
  ListWarehousingResponseSchema,
  type StockedWarehousingQuery,
  StockedWarehousingQuerySchema,
} from '../types/warehousings.js'

/**
 * 入荷実績レスポンス
 */
export const StockedWarehousingResponseSchema = z.object({
  /** 入荷実績リスト */
  warehousings: z.array(WarehousingResponseSchema),
})

export type StockedWarehousingResponse = z.infer<typeof StockedWarehousingResponseSchema>

/**
 * 入荷依頼一覧を取得
 * 公式APIではクエリパラメータは使用しない
 *
 * @param client - OpenLogiクライアント
 * @returns 入荷依頼一覧
 *
 * @example
 * ```typescript
 * const response = await listWarehousing(client)
 * ```
 */
export async function listWarehousing(client: OpenLogiClient): Promise<ListWarehousingResponse> {
  return request(client, ListWarehousingResponseSchema, 'warehousings', {
    method: 'GET',
  })
}

/**
 * 入荷依頼を作成
 *
 * @param client - OpenLogiクライアント
 * @param data - 入荷依頼データ
 * @returns 作成された入荷依頼情報
 *
 * @example
 * ```typescript
 * const warehousing = await createWarehousing(client, {
 *   inspection_type: 'CODE',
 *   arrival_date: '2025-01-20',
 *   items: [
 *     { code: 'ITEM-001', quantity: 100 },
 *   ],
 * })
 * ```
 */
export async function createWarehousing(
  client: OpenLogiClient,
  data: CreateWarehousingRequest,
): Promise<WarehousingResponse> {
  return request(client, WarehousingResponseSchema, 'warehousings', {
    method: 'POST',
    json: data,
  })
}

/**
 * 入荷依頼情報を取得
 *
 * @param client - OpenLogiクライアント
 * @param id - 入荷依頼ID
 * @returns 入荷依頼情報
 *
 * @example
 * ```typescript
 * const warehousing = await getWarehousing(client, '12345')
 * ```
 */
export async function getWarehousing(
  client: OpenLogiClient,
  id: string,
): Promise<WarehousingResponse> {
  return request(client, WarehousingResponseSchema, `warehousings/${id}`, {
    method: 'GET',
  })
}

/**
 * 入荷依頼を更新
 *
 * @param client - OpenLogiクライアント
 * @param id - 入荷依頼ID
 * @param data - 更新データ
 * @returns 更新された入荷依頼情報
 *
 * @example
 * ```typescript
 * const warehousing = await updateWarehousing(client, '12345', {
 *   arrival_date: '2025-01-25',
 *   items: [
 *     { code: 'ITEM-001', quantity: 150 },
 *   ],
 * })
 * ```
 */
export async function updateWarehousing(
  client: OpenLogiClient,
  id: string,
  data: UpdateWarehousingRequest,
): Promise<WarehousingResponse> {
  return request(client, WarehousingResponseSchema, `warehousings/${id}`, {
    method: 'PUT',
    json: data,
  })
}

/**
 * 入荷依頼を削除
 * 公式APIでは200 OKでWarehousingResponseを返す
 *
 * @param client - OpenLogiクライアント
 * @param id - 入荷依頼ID
 * @returns 削除された入荷依頼情報
 *
 * @example
 * ```typescript
 * const response = await deleteWarehousing(client, '12345')
 * ```
 */
export async function deleteWarehousing(
  client: OpenLogiClient,
  id: string,
): Promise<WarehousingResponse> {
  return request(client, WarehousingResponseSchema, `warehousings/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 直近の入荷実績を取得
 * 公式APIではdate_beforeとdate_afterパラメータをサポート（YYYYMMDD形式）
 *
 * @param client - OpenLogiクライアント
 * @param query - クエリパラメータ（date_before, date_after）
 * @returns 直近の入荷実績リスト
 *
 * @example
 * ```typescript
 * // パラメータなし
 * const stocked = await getStockedWarehousing(client)
 *
 * // 日付範囲指定
 * const stocked = await getStockedWarehousing(client, {
 *   date_before: '20250120',
 *   date_after: '20250101',
 * })
 * ```
 */
export async function getStockedWarehousing(
  client: OpenLogiClient,
  query?: StockedWarehousingQuery,
): Promise<StockedWarehousingResponse> {
  const validatedQuery = query ? StockedWarehousingQuerySchema.parse(query) : undefined
  return request(client, StockedWarehousingResponseSchema, 'warehousings/stocked', {
    method: 'GET',
    searchParams: validatedQuery as Record<string, string>,
  })
}

/**
 * 指定年月日の入荷実績を取得
 *
 * @param client - OpenLogiクライアント
 * @param year - 年
 * @param month - 月
 * @param day - 日
 * @returns 指定日の入荷実績リスト
 *
 * @example
 * ```typescript
 * const stocked = await getStockedWarehousingByDate(client, 2025, 1, 20)
 * ```
 */
export async function getStockedWarehousingByDate(
  client: OpenLogiClient,
  year: number,
  month: number,
  day: number,
): Promise<StockedWarehousingResponse> {
  return request(
    client,
    StockedWarehousingResponseSchema,
    `warehousings/stocked/${year}/${month}/${day}`,
    {
      method: 'GET',
    },
  )
}

/**
 * 入荷ラベルをPDF形式で取得
 *
 * @param client - OpenLogiクライアント
 * @param id - 入荷依頼ID
 * @returns PDFファイルのBlob
 *
 * @example
 * ```typescript
 * const pdfBlob = await getWarehousingLabel(client, '12345')
 * // ブラウザでダウンロード
 * const url = URL.createObjectURL(pdfBlob)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'warehousing-label.pdf'
 * a.click()
 * ```
 */
export async function getWarehousingLabel(client: OpenLogiClient, id: string): Promise<Blob> {
  const response = await client.http.get(`warehousings/${id}.pdf`)
  return response.blob()
}
