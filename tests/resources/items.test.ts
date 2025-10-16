/**
 * Items API のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../setup'
import { createClient } from '../../src/client'
import {
  listItems,
  listItemsByAccountId,
  createItem,
  bulkCreateItems,
  getItem,
  updateItem,
  deleteItem,
  uploadItemImage,
  uploadItemImageByCode,
  deleteItemImage,
  deleteItemImageByCode,
  getItemByCode,
  updateItemByCode,
  deleteItemByCode,
} from '../../src/resources/items'
import {
  ApiError,
  ValidationError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
} from '../../src/errors'

const BASE_URL = 'http://localhost:8080/api'

describe('Items API', () => {
  let client: ReturnType<typeof createClient>

  beforeEach(() => {
    client = createClient({
      apiToken: 'test-token',
    })
  })

  describe('listItems', () => {
    it('商品一覧を取得できる（ID指定必須）', async () => {
      const response = await listItems(client, {
        id: 'item-001,item-002',
      })

      expect(response.items).toHaveLength(2)
      expect(response.items[0]).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'Test Item 1',
        price: '1000',
      })
    })

    it('在庫情報を含めて取得できる', async () => {
      const response = await listItems(client, {
        id: 'item-001',
        stock: 1,
      })

      expect(response.items).toBeDefined()
    })

    it('idを指定しない場合はValidationErrorとなる', async () => {
      await expect(
        // @ts-expect-error intentionally invalid to confirm runtime validation
        listItems(client, {}),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('createItem', () => {
    it('商品を作成できる', async () => {
      const itemData = {
        code: 'NEW-001',
        name: 'New Item',
        temperature_zone: 'dry' as const,
      }

      const response = await createItem(client, itemData)

      expect(response).toMatchObject({
        id: 'item-new',
        code: 'NEW-001',
        name: 'New Item',
      })
      expect(response.created_at).toBeDefined()
      expect(response.updated_at).toBeDefined()
    })

    it('商品コードが空の場合はValidationErrorとなる', async () => {
      await expect(
        createItem(client, {
          code: '',
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('認証エラーが発生する', async () => {
      server.use(
        http.post(`${BASE_URL}/items`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
      )

      await expect(
        createItem(client, {
          code: 'TEST-001',
          price: 1000,
        }),
      ).rejects.toThrow()
    })
  })

  describe('bulkCreateItems', () => {
    it('商品を一括作成できる', async () => {
      const itemsData = {
        items: [
          { code: 'BULK-001', price: 1000 },
          { code: 'BULK-002', price: 2000 },
        ],
      }

      const response = await bulkCreateItems(client, itemsData)

      expect(response.items).toHaveLength(2)
      expect(response.items[0]).toMatchObject({
        code: 'BULK-001',
        price: '1000',
      })
    })
  })

  describe('getItem', () => {
    it('商品を取得できる', async () => {
      const response = await getItem(client, 'item-001')

      expect(response).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'Test Item',
        price: '1000',
      })
    })

    it('存在しない商品はNotFoundErrorを投げる', async () => {
      await expect(getItem(client, 'not-found')).rejects.toThrow()
    })

    it('在庫情報を含めて取得できる', async () => {
      const response = await getItem(client, 'item-001', { stock: 1 })

      expect(response.stock).toBe(100)
    })
  })

  describe('updateItem', () => {
    it('商品を更新できる', async () => {
      const updateData = {
        price: 1500,
        name: 'Updated Item',
      }

      const response = await updateItem(client, 'item-001', updateData)

      expect(response).toMatchObject({
        id: 'item-001',
        price: '1500',
        name: 'Updated Item',
      })
      expect(response.updated_at).toBeDefined()
    })

    it('一部のフィールドのみ更新できる', async () => {
      const response = await updateItem(client, 'item-001', {
        price: 2000,
      })

      expect(response.price).toBe('2000')
    })
  })

  describe('deleteItem', () => {
    it('商品を削除できる', async () => {
      const response = await deleteItem(client, 'item-001')

      expect(response).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'Deleted Item',
        price: '1000',
      })
    })

    it('存在しない商品の削除はエラーを投げる', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:id`, () => {
          return HttpResponse.json({ message: 'Item not found' }, { status: 404 })
        }),
      )

      await expect(deleteItem(client, 'not-found')).rejects.toThrow()
    })
  })

  describe('uploadItemImage', () => {
    it('商品画像をアップロードできる', async () => {
      const imageBlob = new Blob(['fake-image-data'], { type: 'image/png' })

      const response = await uploadItemImage(client, 'item-001', imageBlob)

      // 公式仕様: レスポンスは {id: string} のみ
      expect(response).toMatchObject({
        id: 'img-001',
      })
      expect(response.id).toBeDefined()
      expect(typeof response.id).toBe('string')
    })

    it('jpeg形式の画像をアップロードできる', async () => {
      const imageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' })

      const response = await uploadItemImage(client, 'item-001', imageBlob)

      expect(response.id).toBe('img-001')
      expect(typeof response.id).toBe('string')
    })

    it('File オブジェクトでアップロードできる', async () => {
      const file = new File(['fake-image-data'], 'test.png', {
        type: 'image/png',
      })

      const response = await uploadItemImage(client, 'item-001', file)

      expect(response).toMatchObject({
        id: 'img-001',
      })
      expect(typeof response.id).toBe('string')
    })
  })

  describe('deleteItemImage', () => {
    it('商品画像を削除できる', async () => {
      await expect(deleteItemImage(client, 'item-001', 'img-001')).resolves.not.toThrow()
    })

    it('存在しない画像の削除はエラーを投げる', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:id/images/:imageId`, () => {
          return HttpResponse.json({ message: 'Image not found' }, { status: 404 })
        }),
      )

      await expect(deleteItemImage(client, 'item-001', 'not-found')).rejects.toThrow()
    })

    it('空のitemIdでエラーが発生する', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:id/images/:imageId`, () => {
          return HttpResponse.json({ message: 'Invalid item ID' }, { status: 400 })
        }),
      )

      await expect(deleteItemImage(client, '', 'img-001')).rejects.toThrow()
    })

    it('認証エラーが発生する', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:id/images/:imageId`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
      )

      // deleteItemImage uses client.http.delete directly, so errors are HTTPError not custom errors
      await expect(deleteItemImage(client, 'item-001', 'img-001')).rejects.toThrow()
    })

    it('正しいエンドポイントを呼び出す', async () => {
      let calledPath = ''
      server.use(
        http.delete(`${BASE_URL}/items/:id/images/:imageId`, ({ request }) => {
          calledPath = new URL(request.url).pathname
          return HttpResponse.json({})
        }),
      )

      await deleteItemImage(client, 'item-001', 'img-001')

      expect(calledPath).toBe('/api/items/item-001/images/img-001')
    })
  })

  describe('listItemsByAccountId', () => {
    it('アカウントIDと識別番号・商品コードで商品一覧を取得できる', async () => {
      const response = await listItemsByAccountId(client, 'ACC-001', {
        identifier: 'ID-001',
        code: 'CODE-001',
      })

      expect(response.items).toHaveLength(1)
      expect(response.items[0].code).toBe('CODE-001')
    })

    it('必要なクエリを指定しない場合はValidationErrorとなる', async () => {
      await expect(
        // @ts-expect-error runtime validation check
        listItemsByAccountId(client, 'ACC-001', { identifier: 'ID-001' }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('listItemsByAccountId エンドポイント検証', () => {
    it('正しいエンドポイント /items/{account_id} を呼び出す', async () => {
      let calledPath = ''
      let calledSearchParams: URLSearchParams | null = null

      server.use(
        http.get(`${BASE_URL}/items/:id`, ({ request, params }) => {
          const url = new URL(request.url)
          calledPath = url.pathname
          calledSearchParams = url.searchParams
          const identifier = url.searchParams.get('identifier')
          const code = url.searchParams.get('code')

          if (identifier && code) {
            return HttpResponse.json({
              items: [
                {
                  id: 'item-001',
                  code: code.split(',')[0] ?? 'UNKNOWN',
                  name: 'Account Item',
                  price: '1000',
                  temperature_zone: 'dry',
                  stock: 100,
                  created_at: '2025-01-10T00:00:00Z',
                  updated_at: '2025-01-10T00:00:00Z',
                },
              ],
            })
          }

          // Fallback for single item GET
          return HttpResponse.json({
            id: params.id as string,
            code: 'TEST-001',
            name: 'Test Item',
            price: '1000',
            temperature_zone: 'dry',
            stock: 100,
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      await listItemsByAccountId(client, 'ACC-001', {
        identifier: 'ID-001',
        code: 'CODE-001',
      })

      expect(calledPath).toBe('/api/items/ACC-001')
      expect(calledSearchParams?.get('identifier')).toBe('ID-001')
      expect(calledSearchParams?.get('code')).toBe('CODE-001')
    })

    it('identifier と code が両方ある場合のみ正しく動作する', async () => {
      const response = await listItemsByAccountId(client, 'ACC-001', {
        identifier: 'ID-001',
        code: 'CODE-001,CODE-002',
      })

      expect(response.items).toHaveLength(1)
      expect(response.items[0].code).toBe('CODE-001')
    })
  })

  describe('商品画像 code 指定', () => {
    it('code指定で商品画像をアップロードできる', async () => {
      const file = new Blob(['fake-image-data'], { type: 'image/png' })

      const response = await uploadItemImageByCode(client, 'ACC-001', 'CODE-001', file)

      expect(response.id).toBe('img-002')
    })

    it('code指定で商品画像を削除できる', async () => {
      await expect(
        deleteItemImageByCode(client, 'ACC-001', 'CODE-001', 'img-002'),
      ).resolves.not.toThrow()
    })

    it('正しいパスでAPIを呼び出す（/items/{account_id}/{code}/{image_id}）', async () => {
      let calledPath = ''
      server.use(
        http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, ({ request }) => {
          calledPath = new URL(request.url).pathname
          return HttpResponse.json({})
        }),
      )

      await deleteItemImageByCode(client, 'ACC-001', 'CODE-001', 'img-002')

      expect(calledPath).toBe('/api/items/ACC-001/CODE-001/img-002')
    })

    it('存在しない画像の削除はエラーを投げる', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, () => {
          return HttpResponse.json({ message: 'Image not found' }, { status: 404 })
        }),
      )

      // deleteItemImageByCode uses client.http.delete directly, so errors are HTTPError not custom errors
      await expect(
        deleteItemImageByCode(client, 'ACC-001', 'CODE-001', 'not-found'),
      ).rejects.toThrow()
    })

    it('存在しない商品コードでエラーを投げる', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, () => {
          return HttpResponse.json({ message: 'Item not found' }, { status: 404 })
        }),
      )

      // deleteItemImageByCode uses client.http.delete directly, so errors are HTTPError not custom errors
      await expect(
        deleteItemImageByCode(client, 'ACC-001', 'INVALID-CODE', 'img-002'),
      ).rejects.toThrow()
    })

    it('認証エラーが発生する', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
      )

      // deleteItemImageByCode uses client.http.delete directly, so errors are HTTPError not custom errors
      await expect(
        deleteItemImageByCode(client, 'ACC-001', 'CODE-001', 'img-002'),
      ).rejects.toThrow()
    })

    it('空のaccountIdでエラーが発生する', async () => {
      server.use(
        http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, () => {
          return HttpResponse.json({ message: 'Invalid account ID' }, { status: 400 })
        }),
      )

      await expect(deleteItemImageByCode(client, '', 'CODE-001', 'img-002')).rejects.toThrow()
    })

    it('特殊文字を含む商品コードも正しく処理できる', async () => {
      let calledPath = ''
      server.use(
        http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, ({ request }) => {
          calledPath = new URL(request.url).pathname
          return HttpResponse.json({})
        }),
      )

      await deleteItemImageByCode(client, 'ACC-001', 'CODE-001-SPECIAL', 'img-002')

      expect(calledPath).toBe('/api/items/ACC-001/CODE-001-SPECIAL/img-002')
    })
  })

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/items`, () => {
          return HttpResponse.error()
        }),
      )

      await expect(listItems(client, { id: 'item-001' })).rejects.toThrow()
    })

    it('500エラーを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/items`, () => {
          return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
        }),
      )

      await expect(listItems(client, { id: 'item-001' })).rejects.toThrow()
    })

    it('不正なレスポンスを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/items`, () => {
          return HttpResponse.json({
            invalid: 'response',
          })
        }),
      )

      await expect(listItems(client, { id: 'item-001' })).rejects.toThrow(ValidationError)
    })

    describe('Bad Request Errors (400)', () => {
      it('createItem should handle 400 bad request errors from server', async () => {
        server.use(
          http.post(`${BASE_URL}/items`, () => {
            return HttpResponse.json(
              {
                error: 'Bad Request',
                message: 'Server rejected the request data',
              },
              { status: 400 },
            )
          }),
        )

        // Pass data that passes client-side validation but server rejects
        // Note: SDK treats 400 as ValidationError
        const error = await createItem(client, {
          code: 'VALID-CODE-BUT-SERVER-REJECTS',
          name: 'Valid Name',
          temperature_zone: 'dry',
        }).catch((e) => e)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toContain('Server rejected the request data')
      })

      it('bulkCreateItems should handle 400 bad request errors from server', async () => {
        server.use(
          http.post(`${BASE_URL}/items/bulk`, () => {
            return HttpResponse.json(
              {
                error: 'Bad Request',
                message: 'Server rejected the batch request',
              },
              { status: 400 },
            )
          }),
        )

        // Pass data that passes client-side validation but server rejects
        // Note: SDK treats 400 as ValidationError
        const error = await bulkCreateItems(client, {
          items: [
            { code: 'VALID-CODE-1', price: 1000 },
            { code: 'VALID-CODE-2', price: 2000 },
          ],
        }).catch((e) => e)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toContain('Server rejected the batch request')
      })
    })

    describe('Conflict Errors (409)', () => {
      it('createItem should handle 409 conflict errors for duplicate item code', async () => {
        server.use(
          http.post(`${BASE_URL}/items`, () => {
            return HttpResponse.json(
              {
                error: 'Conflict',
                message: 'Item with code TEST-001 already exists',
              },
              { status: 409 },
            )
          }),
        )

        const error = await createItem(client, {
          code: 'TEST-001',
          name: 'Test Item',
        }).catch((e) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error.statusCode).toBe(409)
      })
    })

    describe('Server Errors (502/503)', () => {
      it('listItems should handle 502 Bad Gateway errors', async () => {
        server.use(
          http.get(`${BASE_URL}/items`, () => {
            return HttpResponse.json(
              {
                error: 'Bad Gateway',
                message: 'Upstream server error',
              },
              { status: 502 },
            )
          }),
        )

        const error = await listItems(client, { id: 'item-001' }).catch((e) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error.statusCode).toBe(502)
      })

      it('getItem should handle 503 Service Unavailable errors', async () => {
        server.use(
          http.get(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json(
              {
                error: 'Service Unavailable',
                message: 'Server is temporarily unavailable',
              },
              { status: 503 },
            )
          }),
        )

        const error = await getItem(client, 'item-001').catch((e) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error.statusCode).toBe(503)
      })
    })

    describe('Malformed Response Errors', () => {
      it('listItems should handle malformed JSON responses', async () => {
        server.use(
          http.get(`${BASE_URL}/items`, () => {
            return new Response('{ invalid json }', {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          }),
        )

        await expect(listItems(client, { id: 'item-001' })).rejects.toThrow()
      })

      it('getItem should handle responses missing required fields', async () => {
        server.use(
          http.get(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json({
              // Missing required fields like 'code', 'name'
              id: 'item-001',
            })
          }),
        )

        await expect(getItem(client, 'item-001')).rejects.toThrow(ValidationError)
      })
    })

    describe('Rate Limit Errors (429)', () => {
      it('listItems should handle rate limit errors', async () => {
        // Create a client with no retries to avoid timeout in tests
        const noRetryClient = createClient({
          apiToken: 'test-token',
          retry: 0,
        })

        server.use(
          http.get(`${BASE_URL}/items`, () => {
            return HttpResponse.json(
              { error: 'Too Many Attempts.', error_description: 'Too Many Attempts.' },
              {
                status: 429,
                headers: {
                  'X-RateLimit-Limit': '60',
                  'X-RateLimit-Remaining': '0',
                  'Retry-After': '60',
                },
              },
            )
          }),
        )

        const error = await listItems(noRetryClient, { id: 'item-001' }).catch((e) => e)
        expect(error).toBeInstanceOf(RateLimitError)
        expect(error.statusCode).toBe(429)
        expect(error.retryAfter).toBe(60)
      })
    })

    describe('Unauthorized Errors (401)', () => {
      it('getItem should handle authentication errors', async () => {
        server.use(
          http.get(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json(
              { error: 'Unauthorized', error_description: 'Invalid API token' },
              { status: 401 },
            )
          }),
        )

        await expect(getItem(client, 'item-001')).rejects.toThrow(AuthenticationError)
      })

      it('updateItem should handle authentication errors', async () => {
        server.use(
          http.put(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json(
              { error: 'Unauthorized', error_description: 'Invalid API token' },
              { status: 401 },
            )
          }),
        )

        await expect(updateItem(client, 'item-001', { price: 1500 })).rejects.toThrow(
          AuthenticationError,
        )
      })

      it('deleteItem should handle authentication errors', async () => {
        server.use(
          http.delete(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json(
              { error: 'Unauthorized', error_description: 'Invalid API token' },
              { status: 401 },
            )
          }),
        )

        await expect(deleteItem(client, 'item-001')).rejects.toThrow(AuthenticationError)
      })
    })

    describe('Not Found Errors (404)', () => {
      it('listItemsByAccountId should handle not found errors', async () => {
        server.use(
          http.get(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json(
              { error: 'Not Found', error_description: 'Account not found' },
              { status: 404 },
            )
          }),
        )

        await expect(
          listItemsByAccountId(client, 'INVALID-ACCOUNT', {
            identifier: 'ID-001',
            code: 'CODE-001',
          }),
        ).rejects.toThrow(NotFoundError)
      })

      it('getItemByCode should handle not found errors', async () => {
        server.use(
          http.get(`${BASE_URL}/items/:accountId/:code`, () => {
            return HttpResponse.json(
              { error: 'Not Found', error_description: 'Item not found' },
              { status: 404 },
            )
          }),
        )

        await expect(getItemByCode(client, 'ACC-001', 'INVALID-CODE')).rejects.toThrow(
          NotFoundError,
        )
      })
    })

    describe('Validation Errors (422)', () => {
      it('updateItem should handle validation errors from API', async () => {
        server.use(
          http.put(`${BASE_URL}/items/:id`, () => {
            return HttpResponse.json(
              {
                error: 'validation_failed',
                error_description: 'Invalid price value',
                errors: {
                  price: ['Price must be a positive integer'],
                },
              },
              { status: 422 },
            )
          }),
        )

        await expect(updateItem(client, 'item-001', { price: -100 })).rejects.toThrow()
      })

      it('bulkCreateItems should handle validation errors for multiple items', async () => {
        server.use(
          http.post(`${BASE_URL}/items/bulk`, () => {
            return HttpResponse.json(
              {
                error: 'validation_failed',
                error_description: 'Validation failed for multiple items',
                errors: {
                  'items.0.code': ['Code is required'],
                  'items.1.price': ['Price must be positive'],
                },
              },
              { status: 422 },
            )
          }),
        )

        await expect(
          bulkCreateItems(client, {
            items: [
              { code: '', price: 1000 },
              { code: 'VALID-CODE', price: -100 },
            ],
          }),
        ).rejects.toThrow()
      })
    })
  })

  describe('スキーマの拡張性', () => {
    it('定義されていないフィールドがあってもバリデーションエラーにならない', async () => {
      server.use(
        http.post(`${BASE_URL}/items`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>

          // リクエストに未定義のフィールドが含まれていることを確認
          expect(body).toHaveProperty('future_field')
          expect(body.future_field).toBe('some value')

          return HttpResponse.json({
            id: 'item-new',
            code: body.code,
            name: body.name || 'New Item',
            temperature_zone: 'dry',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const itemData = {
        code: 'NEW-001',
        name: 'New Item',
        // 将来追加されるかもしれないフィールド
        future_field: 'some value',
      }

      // バリデーションエラーにならないことを確認
      const response = await createItem(client, itemData)
      expect(response.id).toBe('item-new')
      expect(response.code).toBe('NEW-001')
    })

    it('一括作成でも定義されていないフィールドを受け入れる', async () => {
      server.use(
        http.post(`${BASE_URL}/items/bulk`, async ({ request }) => {
          const body = (await request.json()) as { items: Array<Record<string, unknown>> }

          // 未定義のフィールドが含まれていることを確認
          expect(body.items[0]).toHaveProperty('experimental_feature')

          return HttpResponse.json({
            items: body.items.map((item, index) => ({
              id: `bulk-${index + 1}`,
              code: item.code,
              name: item.name || `Item ${index + 1}`,
              price: String(item.price || 0),
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })),
          })
        }),
      )

      const itemsData = {
        items: [
          {
            code: 'BULK-001',
            price: 1000,
            experimental_feature: true,
          },
        ],
      }

      const response = await bulkCreateItems(client, itemsData)
      expect(response.items).toHaveLength(1)
      expect(response.items[0].code).toBe('BULK-001')
    })

    it('更新時も定義されていないフィールドを受け入れる', async () => {
      server.use(
        http.patch(`${BASE_URL}/items/:id`, async ({ request, params }) => {
          const body = (await request.json()) as Record<string, unknown>

          // 未定義のフィールドが含まれていることを確認
          expect(body).toHaveProperty('new_metadata')

          return HttpResponse.json({
            id: params.id,
            code: 'TEST-001',
            name: body.name || 'Test Item',
            price: String(body.price || 1000),
            temperature_zone: 'dry',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const updateData = {
        name: 'Updated Item',
        new_metadata: { version: 2 },
      }

      const response = await updateItem(client, 'item-001', updateData)
      expect(response.name).toBe('Updated Item')
    })
  })

  describe('code指定系API', () => {
    describe('getItemByCode', () => {
      it('アカウントIDとコードで商品を取得できる', async () => {
        const response = await getItemByCode(client, 'ACC-001', 'TEST-001')

        expect(response).toMatchObject({
          id: 'item-by-code',
          code: 'TEST-001',
          name: 'Item TEST-001',
        })
        expect(response.created_at).toBeDefined()
        expect(response.updated_at).toBeDefined()
      })

      it('正しいエンドポイント /items/{account_id}/{code} を呼び出す', async () => {
        let calledPath = ''

        server.use(
          http.get(`${BASE_URL}/items/:accountId/:code`, ({ request }) => {
            calledPath = new URL(request.url).pathname
            return HttpResponse.json({
              id: 'item-001',
              code: 'VERIFY-PATH',
              name: 'Test Item',
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        await getItemByCode(client, 'ACC-001', 'VERIFY-PATH')

        expect(calledPath).toBe('/api/items/ACC-001/VERIFY-PATH')
      })

      it('存在しない商品はエラーを投げる', async () => {
        await expect(getItemByCode(client, 'ACC-001', 'NOT-FOUND')).rejects.toThrow()
      })

      it('在庫情報を含めて取得できる', async () => {
        server.use(
          http.get(`${BASE_URL}/items/:accountId/:code`, ({ request }) => {
            const url = new URL(request.url)
            const stock = url.searchParams.get('stock')

            return HttpResponse.json({
              id: 'item-001',
              code: 'TEST-001',
              name: 'Test Item',
              temperature_zone: 'dry',
              stock: stock === '1' ? 150 : undefined,
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await getItemByCode(client, 'ACC-001', 'TEST-001', { stock: 1 })

        expect(response.stock).toBe(150)
      })
    })

    describe('updateItemByCode', () => {
      it('アカウントIDとコードで商品を更新できる', async () => {
        const updateData = {
          price: 2000,
          name: 'Updated by Code',
        }

        const response = await updateItemByCode(client, 'ACC-001', 'TEST-001', updateData)

        expect(response).toMatchObject({
          id: 'item-by-code-updated',
          code: 'TEST-001',
          price: '2000',
          name: 'Updated by Code',
        })
        expect(response.updated_at).toBeDefined()
      })

      it('正しいエンドポイント /items/{account_id}/{code} を呼び出す', async () => {
        let calledPath = ''
        let receivedBody: Record<string, unknown> = {}

        server.use(
          http.put(`${BASE_URL}/items/:accountId/:code`, async ({ request }) => {
            calledPath = new URL(request.url).pathname
            receivedBody = (await request.json()) as Record<string, unknown>

            return HttpResponse.json({
              id: 'item-001',
              code: 'VERIFY-PATH',
              name: 'Test Item',
              temperature_zone: 'dry',
              updated_at: '2025-01-11T00:00:00Z',
            })
          }),
        )

        await updateItemByCode(client, 'ACC-001', 'VERIFY-PATH', { price: 3000 })

        expect(calledPath).toBe('/api/items/ACC-001/VERIFY-PATH')
        expect(receivedBody).toHaveProperty('price', 3000)
      })

      it('部分的な更新ができる', async () => {
        const response = await updateItemByCode(client, 'ACC-001', 'TEST-001', {
          price: 1500,
        })

        expect(response.price).toBe('1500')
        expect(response.code).toBe('TEST-001')
      })
    })

    describe('deleteItemByCode', () => {
      it('アカウントIDとコードで商品を削除できる', async () => {
        const response = await deleteItemByCode(client, 'ACC-001', 'TEST-001')

        expect(response).toMatchObject({
          id: 'item-by-code-deleted',
          code: 'TEST-001',
          name: 'Deleted Item',
        })
      })

      it('正しいエンドポイント /items/{account_id}/{code} を呼び出す', async () => {
        let calledPath = ''

        server.use(
          http.delete(`${BASE_URL}/items/:accountId/:code`, ({ request }) => {
            calledPath = new URL(request.url).pathname
            return HttpResponse.json({
              id: 'item-001',
              code: 'VERIFY-PATH',
              name: 'Deleted Item',
              temperature_zone: 'dry',
              updated_at: '2025-01-11T00:00:00Z',
            })
          }),
        )

        await deleteItemByCode(client, 'ACC-001', 'VERIFY-PATH')

        expect(calledPath).toBe('/api/items/ACC-001/VERIFY-PATH')
      })
    })
  })

  describe('バリデーション詳細', () => {
    describe('商品コード (code)', () => {
      it('空文字列は拒否される', async () => {
        await expect(
          createItem(client, {
            code: '',
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('30文字の商品コードは受け入れられる', async () => {
        const longCode = 'A'.repeat(30)

        server.use(
          http.post(`${BASE_URL}/items`, async ({ request }) => {
            const body = (await request.json()) as { code: string }
            return HttpResponse.json({
              id: 'item-new',
              code: body.code,
              name: 'New Item',
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await createItem(client, { code: longCode })
        expect(response.code).toBe(longCode)
      })

      it('31文字の商品コードは拒否される', async () => {
        const tooLongCode = 'A'.repeat(31)

        await expect(
          createItem(client, {
            code: tooLongCode,
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('商品名 (name)', () => {
      it('255文字の商品名は受け入れられる', async () => {
        const longName = 'あ'.repeat(255)

        server.use(
          http.post(`${BASE_URL}/items`, async ({ request }) => {
            const body = (await request.json()) as { code: string; name: string }
            return HttpResponse.json({
              id: 'item-new',
              code: body.code,
              name: body.name,
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await createItem(client, { code: 'TEST', name: longName })
        expect(response.name).toBe(longName)
      })

      it('256文字の商品名は拒否される', async () => {
        const tooLongName = 'あ'.repeat(256)

        await expect(
          createItem(client, {
            code: 'TEST',
            name: tooLongName,
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('HSコード (hs_code)', () => {
      it('正しいHSコードのパターンを受け入れる', async () => {
        const validCodes = ['1234.56', '1234.56.789', '1234.56-7890', '123456']

        for (const hsCode of validCodes) {
          server.use(
            http.post(`${BASE_URL}/items`, async ({ request }) => {
              const body = (await request.json()) as { code: string; hs_code: string }
              return HttpResponse.json({
                id: 'item-new',
                code: body.code,
                name: 'Test Item',
                hs_code: body.hs_code,
                temperature_zone: 'dry',
                created_at: '2025-01-10T00:00:00Z',
                updated_at: '2025-01-10T00:00:00Z',
              })
            }),
          )

          const response = await createItem(client, {
            code: `TEST-${hsCode}`,
            hs_code: hsCode,
          })

          expect(response.hs_code).toBe(hsCode)
        }
      })

      it('不正なHSコードは拒否される', async () => {
        const invalidCodes = ['123', 'ABCD.EF', '1234.567', '12.34']

        for (const hsCode of invalidCodes) {
          await expect(
            createItem(client, {
              code: 'TEST',
              hs_code: hsCode,
            }),
          ).rejects.toThrow(ValidationError)
        }
      })
    })

    describe('温度帯 (temperature_zone)', () => {
      it('有効な温度帯を受け入れる', async () => {
        const validZones = ['dry', 'constant', 'chilled', 'frozen'] as const

        for (const zone of validZones) {
          server.use(
            http.post(`${BASE_URL}/items`, async ({ request }) => {
              const body = (await request.json()) as {
                code: string
                temperature_zone: string
              }
              return HttpResponse.json({
                id: 'item-new',
                code: body.code,
                name: 'Test Item',
                temperature_zone: body.temperature_zone,
                created_at: '2025-01-10T00:00:00Z',
                updated_at: '2025-01-10T00:00:00Z',
              })
            }),
          )

          const response = await createItem(client, {
            code: `TEST-${zone}`,
            temperature_zone: zone,
          })

          expect(response.temperature_zone).toBe(zone)
        }
      })

      it('不正な温度帯は拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            // @ts-expect-error intentionally invalid for runtime validation test
            temperature_zone: 'invalid',
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('バーコード (barcode)', () => {
      it('30文字以内のバーコードは受け入れられる', async () => {
        const barcode = '1234567890123'

        server.use(
          http.post(`${BASE_URL}/items`, async ({ request }) => {
            const body = (await request.json()) as { code: string; barcode: string }
            return HttpResponse.json({
              id: 'item-new',
              code: body.code,
              name: 'Test Item',
              barcode: body.barcode,
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await createItem(client, { code: 'TEST', barcode })
        expect(response.barcode).toBe(barcode)
      })

      it('31文字以上のバーコードは拒否される', async () => {
        const tooLongBarcode = '1'.repeat(31)

        await expect(
          createItem(client, {
            code: 'TEST',
            barcode: tooLongBarcode,
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('価格 (price)', () => {
      it('数値の価格は受け入れられる', async () => {
        server.use(
          http.post(`${BASE_URL}/items`, async ({ request }) => {
            const body = (await request.json()) as { code: string; price: number }
            return HttpResponse.json({
              id: 'item-new',
              code: body.code,
              name: 'Test Item',
              price: String(body.price),
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await createItem(client, { code: 'TEST', price: 1000 })
        expect(response.price).toBe('1000')
      })

      it('負の価格は拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            price: -100,
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('小数の価格は拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            price: 99.99,
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('子商品 (child_items)', () => {
      it('1-10個の子商品は受け入れられる', async () => {
        const childItems = [
          { code: 'CHILD-001', quantity: 1 },
          { code: 'CHILD-002', quantity: 2 },
        ]

        server.use(
          http.post(`${BASE_URL}/items`, async ({ request }) => {
            const body = (await request.json()) as {
              code: string
              child_items: typeof childItems
            }
            return HttpResponse.json({
              id: 'item-new',
              code: body.code,
              name: 'Bundle Item',
              child_items: body.child_items,
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await createItem(client, {
          code: 'BUNDLE-001',
          child_items: childItems,
        })

        expect(response.child_items).toHaveLength(2)
      })

      it('11個以上の子商品は拒否される', async () => {
        const tooManyChildItems = Array.from({ length: 11 }, (_, i) => ({
          code: `CHILD-${i + 1}`,
          quantity: 1,
        }))

        await expect(
          createItem(client, {
            code: 'BUNDLE-001',
            child_items: tooManyChildItems,
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('空の子商品配列は拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'BUNDLE-001',
            child_items: [],
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('国際情報 (international_info)', () => {
      it('正しい国際情報は受け入れられる', async () => {
        const internationalInfo = {
          invoice_summary: 'Test Product',
          origin: 'JP',
        }

        server.use(
          http.post(`${BASE_URL}/items`, async ({ request }) => {
            const body = (await request.json()) as {
              code: string
              international_info: typeof internationalInfo
            }
            return HttpResponse.json({
              id: 'item-new',
              code: body.code,
              name: 'Test Item',
              international_info: body.international_info,
              temperature_zone: 'dry',
              created_at: '2025-01-10T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
            })
          }),
        )

        const response = await createItem(client, {
          code: 'TEST',
          international_info: internationalInfo,
        })

        expect(response.international_info).toEqual(internationalInfo)
      })

      it('短すぎるinvoice_summaryは拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            international_info: {
              invoice_summary: 'AB',
              origin: 'JP',
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('長すぎるinvoice_summaryは拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            international_info: {
              invoice_summary: 'A'.repeat(76),
              origin: 'JP',
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('小文字の原産国コードは拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            international_info: {
              invoice_summary: 'Test Product',
              origin: 'jp',
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('1文字の原産国コードは拒否される', async () => {
        await expect(
          createItem(client, {
            code: 'TEST',
            international_info: {
              invoice_summary: 'Test Product',
              origin: 'J',
            },
          }),
        ).rejects.toThrow(ValidationError)
      })
    })
  })

  describe('エッジケース: 特殊文字テスト', () => {
    it('絵文字を含む商品名で作成できる', async () => {
      server.use(
        http.post(`${BASE_URL}/items`, async ({ request }) => {
          const body = (await request.json()) as { code: string; name: string }
          return HttpResponse.json({
            id: 'item-emoji',
            code: body.code,
            name: body.name,
            temperature_zone: 'dry',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const item = await createItem(client, {
        code: 'EMOJI-001',
        name: '🎉テスト商品🎁',
        temperature_zone: 'dry',
      })

      expect(item.name).toBe('🎉テスト商品🎁')
      expect(item.code).toBe('EMOJI-001')
    })

    it('16文字の説明文で商品を作成できる（境界値）', async () => {
      const maxDescription = 'A'.repeat(16)

      server.use(
        http.post(`${BASE_URL}/items`, async ({ request }) => {
          const body = (await request.json()) as { code: string; description: string }
          return HttpResponse.json({
            id: 'item-long-desc',
            code: body.code,
            description: body.description,
            name: 'Test Item',
            temperature_zone: 'dry',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const item = await createItem(client, {
        code: 'MAX-DESC-001',
        name: 'Test Item',
        description: maxDescription,
        temperature_zone: 'dry',
      })

      expect(item.description).toBe(maxDescription)
      expect(item.description?.length).toBe(16)
    })

    it('255文字ちょうどの商品名は受け入れられる（境界値）', async () => {
      const exactMaxName = 'あ'.repeat(255)

      server.use(
        http.post(`${BASE_URL}/items`, async ({ request }) => {
          const body = (await request.json()) as { code: string; name: string }
          return HttpResponse.json({
            id: 'item-max-name',
            code: body.code,
            name: body.name,
            temperature_zone: 'dry',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const item = await createItem(client, {
        code: 'MAX-NAME-001',
        name: exactMaxName,
        temperature_zone: 'dry',
      })

      expect(item.name).toBe(exactMaxName)
      expect(item.name.length).toBe(255)
    })
  })

  describe('エッジケース: 配列境界値テスト', () => {
    it('商品を1件だけ一括作成できる（最小）', async () => {
      const itemsData = {
        items: [{ code: 'BULK-SINGLE', price: 1000 }],
      }

      const response = await bulkCreateItems(client, itemsData)
      expect(response.items).toHaveLength(1)
      expect(response.items[0].code).toBe('BULK-SINGLE')
      expect(response.items[0].price).toBe('1000')
    })
  })

  describe('エッジケース: 数値境界値テスト', () => {
    it('価格0（最小）で商品を作成できる', async () => {
      server.use(
        http.post(`${BASE_URL}/items`, async ({ request }) => {
          const body = (await request.json()) as { code: string; price: number }
          return HttpResponse.json({
            id: 'item-zero-price',
            code: body.code,
            name: 'Zero Price Item',
            price: String(body.price),
            temperature_zone: 'dry',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const item = await createItem(client, {
        code: 'ZERO-PRICE-001',
        name: 'Zero Price Item',
        price: 0,
        temperature_zone: 'dry',
      })

      expect(item.price).toBe('0')
      expect(item.code).toBe('ZERO-PRICE-001')
    })

    it('価格999999999（大きな値）で商品を作成できる', async () => {
      server.use(
        http.post(`${BASE_URL}/items`, async ({ request }) => {
          const body = (await request.json()) as { code: string; price: number }
          return HttpResponse.json({
            id: 'item-large-price',
            code: body.code,
            name: 'Large Price Item',
            price: String(body.price),
            temperature_zone: 'dry',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const item = await createItem(client, {
        code: 'LARGE-PRICE-001',
        name: 'Large Price Item',
        price: 999999999,
        temperature_zone: 'dry',
      })

      expect(item.price).toBe('999999999')
      expect(item.code).toBe('LARGE-PRICE-001')
    })
  })

  describe('エッジケース: 空/オプショナルフィールドテスト', () => {
    it('空のオブジェクトで商品を更新しようとすると何も変更されない', async () => {
      server.use(
        http.put(`${BASE_URL}/items/:id`, async ({ request, params }) => {
          const { id } = params
          const body = await request.json()

          // 空のbodyの場合、既存の値を返す
          return HttpResponse.json({
            id: id as string,
            code: 'TEST-001',
            name: 'Existing Item',
            price: '1000',
            temperature_zone: 'dry',
            stock: 100,
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-11T00:00:00Z',
            ...(body && typeof body === 'object' ? body : {}),
          })
        }),
      )

      const response = await updateItem(client, 'item-001', {})

      // 何も変更されないので既存の値が返る
      expect(response.id).toBe('item-001')
      expect(response.code).toBe('TEST-001')
      expect(response.name).toBe('Existing Item')
    })
  })
})
