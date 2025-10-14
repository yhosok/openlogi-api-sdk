/**
 * Items API resource
 * 商品リソースAPIの実装
 *
 * @packageDocumentation
 */

import { z } from 'zod'
import { request, type OpenLogiClient } from '../client.js'
import { ValidationError } from '../errors.js'
import {
  type CreateItemRequest,
  CreateItemRequestSchema,
  type UpdateItemRequest,
  UpdateItemRequestSchema,
  type ItemResponse,
  ItemResponseSchema,
  type ListItemsQuery,
  ListItemsQuerySchema,
  type ListItemsResponse,
  ListItemsResponseSchema,
  type BulkItemRequest,
  BulkItemRequestSchema,
  type BulkItemResponse,
  BulkItemResponseSchema,
  type GetItemQuery,
  GetItemQuerySchema,
  type ListItemsByAccountIdQuery,
  ListItemsByAccountIdQuerySchema,
} from '../types/items.js'

/**
 * 商品画像レスポンス（公式仕様準拠）
 * 公式ドキュメント: https://api.openlogi.com/doc/api.html#tag/items/operation/postItemImage
 * レスポンスには画像IDのみが含まれる
 * 注: 公式ドキュメントのサンプルは数値だが、実際のAPIはstring型を返す
 */
export const ItemImageResponseSchema = z.object({
  /** 画像ID */
  id: z.string(),
})

export type ItemImageResponse = z.infer<typeof ItemImageResponseSchema>

/**
 * 商品一覧を取得
 *
 * @param client - OpenLogiクライアント
 * @param params - クエリパラメータ
 * @returns 商品一覧とページネーション情報
 *
 * @example
 * ```typescript
 * const response = await listItems(client, {
 *   page: 1,
 *   per_page: 20,
 *   temperature_zone: 'dry',
 * })
 * ```
 */
export async function listItems(
  client: OpenLogiClient,
  params?: ListItemsQuery,
): Promise<ListItemsResponse> {
  const result = ListItemsQuerySchema.safeParse(params)

  if (!result.success) {
    throw new ValidationError(
      `クエリパラメータの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ListItemsResponseSchema, 'items', {
    method: 'GET',
    searchParams: result.data as Record<string, string | number>,
  })
}

/**
 * 商品を登録
 *
 * @param client - OpenLogiクライアント
 * @param data - 商品登録データ
 * @returns 登録された商品情報
 *
 * @example
 * ```typescript
 * const item = await createItem(client, {
 *   code: 'ITEM-001',
 *   price: 1000,
 *   name: 'Sample Item',
 * })
 * ```
 */
export async function createItem(
  client: OpenLogiClient,
  data: CreateItemRequest,
): Promise<ItemResponse> {
  const result = CreateItemRequestSchema.safeParse(data)

  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ItemResponseSchema, 'items', {
    method: 'POST',
    json: result.data,
  })
}

/**
 * 商品を一括登録
 *
 * @param client - OpenLogiクライアント
 * @param data - 一括登録データ
 * @returns 一括登録結果
 *
 * @example
 * ```typescript
 * const result = await bulkCreateItems(client, {
 *   items: [
 *     { code: 'ITEM-001', price: 1000 },
 *     { code: 'ITEM-002', price: 2000 },
 *   ],
 * })
 * ```
 */
export async function bulkCreateItems(
  client: OpenLogiClient,
  data: BulkItemRequest,
): Promise<BulkItemResponse> {
  const result = BulkItemRequestSchema.safeParse(data)

  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, BulkItemResponseSchema, 'items/bulk', {
    method: 'POST',
    json: result.data,
  })
}

/**
 * 商品情報を取得
 *
 * @param client - OpenLogiクライアント
 * @param id - 商品ID
 * @returns 商品情報
 *
 * @example
 * ```typescript
 * const item = await getItem(client, '12345')
 * ```
 */
export async function getItem(
  client: OpenLogiClient,
  id: string,
  query?: GetItemQuery,
): Promise<ItemResponse> {
  const parsedQuery = query ? GetItemQuerySchema.parse(query) : undefined

  return request(client, ItemResponseSchema, `items/${id}`, {
    method: 'GET',
    searchParams: parsedQuery as Record<string, string | number> | undefined,
  })
}

/**
 * 商品情報を更新
 *
 * @param client - OpenLogiクライアント
 * @param id - 商品ID
 * @param data - 更新データ
 * @returns 更新された商品情報
 *
 * @example
 * ```typescript
 * const item = await updateItem(client, '12345', {
 *   price: 1500,
 *   name: 'Updated Item',
 * })
 * ```
 */
export async function updateItem(
  client: OpenLogiClient,
  id: string,
  data: UpdateItemRequest,
): Promise<ItemResponse> {
  const result = UpdateItemRequestSchema.safeParse(data)

  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ItemResponseSchema, `items/${id}`, {
    method: 'PUT',
    json: result.data,
  })
}

/**
 * 商品を削除
 *
 * @param client - OpenLogiクライアント
 * @param id - 商品ID
 *
 * @example
 * ```typescript
 * await deleteItem(client, '12345')
 * ```
 */
export async function deleteItem(client: OpenLogiClient, id: string): Promise<ItemResponse> {
  return request(client, ItemResponseSchema, `items/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 商品画像を登録
 *
 * @param client - OpenLogiクライアント
 * @param id - 商品ID
 * @param file - 画像ファイル（File または Blob、jpeg/png形式）
 * @returns 登録された画像情報
 *
 * @example
 * ```typescript
 * const file = new Blob(['...'], { type: 'image/png' })
 * const image = await uploadItemImage(client, '12345', file)
 * console.log(`画像を登録しました: ${image.url}`)
 * ```
 */
export async function uploadItemImage(
  client: OpenLogiClient,
  id: string,
  file: File | Blob,
): Promise<ItemImageResponse> {
  // FormDataを構築（公式ドキュメント通り、nameは'file'）
  const formData = new FormData()

  // Blobの場合はfilenameを明示的に指定（公式仕様でfilenameが必要）
  // Fileの場合はfile.nameが自動的に使われるが、統一性のため明示的に指定
  const filename = file instanceof File ? file.name : 'image.jpg'
  formData.append('file', file, filename)

  // kyのHTTPクライアントを直接使用
  const response = await client.http.post(`items/${id}/images`, {
    body: formData,
    headers: {
      // Content-Typeを明示的に削除してkyに自動設定させる
      'Content-Type': undefined,
    },
  })

  // レスポンスの検証
  const json = await response.json()
  const result = ItemImageResponseSchema.safeParse(json)

  if (!result.success) {
    throw new ValidationError(
      `レスポンスの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return result.data
}

/**
 * code指定で商品画像を登録
 */
export async function uploadItemImageByCode(
  client: OpenLogiClient,
  accountId: string,
  code: string,
  file: File | Blob,
): Promise<ItemImageResponse> {
  const formData = new FormData()
  const filename = file instanceof File ? file.name : 'image.jpg'
  formData.append('file', file, filename)

  const response = await client.http.post(`items/${accountId}/${code}/images`, {
    body: formData,
    headers: {
      'Content-Type': undefined,
    },
  })

  const json = await response.json()
  const result = ItemImageResponseSchema.safeParse(json)

  if (!result.success) {
    throw new ValidationError(
      `レスポンスの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return result.data
}

/**
 * 商品画像を削除
 *
 * @param client - OpenLogiクライアント
 * @param id - 商品ID
 * @param imageId - 画像ID
 *
 * @example
 * ```typescript
 * await deleteItemImage(client, '12345', 'img-001')
 * ```
 */
export async function deleteItemImage(
  client: OpenLogiClient,
  id: string,
  imageId: string,
): Promise<void> {
  await client.http.delete(`items/${id}/images/${imageId}`)
}

/**
 * code指定で商品画像を削除
 */
export async function deleteItemImageByCode(
  client: OpenLogiClient,
  accountId: string,
  code: string,
  imageId: string,
): Promise<void> {
  await client.http.delete(`items/${accountId}/${code}/${imageId}`)
}

/**
 * code指定で商品情報を取得
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントID
 * @param code - 商品コード
 * @returns 商品情報
 *
 * @example
 * ```typescript
 * const item = await getItemByCode(client, 'acc-123', 'ITEM-001')
 * ```
 */
export async function getItemByCode(
  client: OpenLogiClient,
  accountId: string,
  code: string,
  query?: GetItemQuery,
): Promise<ItemResponse> {
  const parsedQuery = query ? GetItemQuerySchema.parse(query) : undefined

  return request(client, ItemResponseSchema, `items/${accountId}/${code}`, {
    method: 'GET',
    searchParams: parsedQuery as Record<string, string | number> | undefined,
  })
}

/**
 * code指定で商品情報を更新
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントID
 * @param code - 商品コード
 * @param data - 更新データ
 * @returns 更新された商品情報
 *
 * @example
 * ```typescript
 * const item = await updateItemByCode(client, 'acc-123', 'ITEM-001', {
 *   price: 1500,
 * })
 * ```
 */
export async function updateItemByCode(
  client: OpenLogiClient,
  accountId: string,
  code: string,
  data: UpdateItemRequest,
): Promise<ItemResponse> {
  const result = UpdateItemRequestSchema.safeParse(data)

  if (!result.success) {
    throw new ValidationError(
      `リクエストの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ItemResponseSchema, `items/${accountId}/${code}`, {
    method: 'PUT',
    json: result.data,
  })
}

/**
 * code指定で商品を削除
 *
 * @param client - OpenLogiクライアント
 * @param accountId - アカウントID
 * @param code - 商品コード
 *
 * @example
 * ```typescript
 * await deleteItemByCode(client, 'acc-123', 'ITEM-001')
 * ```
 */
export async function deleteItemByCode(
  client: OpenLogiClient,
  accountId: string,
  code: string,
): Promise<ItemResponse> {
  return request(client, ItemResponseSchema, `items/${accountId}/${code}`, {
    method: 'DELETE',
  })
}

/**
 * アカウントID指定で商品一覧を取得
 */
export async function listItemsByAccountId(
  client: OpenLogiClient,
  accountId: string,
  query: ListItemsByAccountIdQuery,
): Promise<ListItemsResponse> {
  const result = ListItemsByAccountIdQuerySchema.safeParse(query)

  if (!result.success) {
    throw new ValidationError(
      `クエリパラメータの検証に失敗しました: ${result.error.message}`,
      result.error,
      result.error,
    )
  }

  return request(client, ListItemsResponseSchema, `items/${accountId}`, {
    method: 'GET',
    searchParams: result.data as Record<string, string | number>,
  })
}
