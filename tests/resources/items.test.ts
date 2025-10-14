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
} from '../../src/resources/items'
import { ValidationError } from '../../src/errors'

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
  })
})
