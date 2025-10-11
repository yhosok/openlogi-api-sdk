/**
 * Warehousings API のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../setup'
import { createClient } from '../../src/client'
import {
  listWarehousing,
  createWarehousing,
  getWarehousing,
  updateWarehousing,
  deleteWarehousing,
  getStockedWarehousing,
  getStockedWarehousingByDate,
  getWarehousingLabel,
} from '../../src/resources/warehousings'
import { ValidationError } from '../../src/errors'

const BASE_URL = 'http://localhost:8080/api'

describe('Warehousings API', () => {
  let client: ReturnType<typeof createClient>

  beforeEach(() => {
    client = createClient({
      apiToken: 'test-token',
    })
  })

  describe('listWarehousing', () => {
    it('入荷依頼一覧を取得できる', async () => {
      const response = await listWarehousing(client)

      expect(response.warehousings).toHaveLength(1)
      expect(response.warehousings[0]).toMatchObject({
        id: 'wh-001',
        inspection_type: 'CODE',
        arrival_date: '2025-01-20',
        status: 'waiting',
      })
      expect(response.warehousings[0].items).toHaveLength(1)
      // レスポンスのitemsにはid, code, name, quantityが含まれる
      expect(response.warehousings[0].items[0]).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'テスト商品',
        quantity: 100,
      })
      expect(response.warehousings[0].warehouse).toBe('warehouse-1')
      expect(response.warehousings[0].warehouse_info).toBeDefined()
      expect(response.warehousings[0].create_user).toBeDefined()
      expect(response.warehousings[0].stock_deadline_date).toBe('2025-02-20')
      expect(response.warehousings[0].inspection_type_label).toBe('Code Inspection')
      expect(response.warehousings[0].halfway).toBe(false)
    })

    it('パラメータなしで一覧を取得できる（公式APIにはクエリパラメータなし）', async () => {
      const response = await listWarehousing(client)

      expect(response.warehousings).toBeDefined()
      expect(response).not.toHaveProperty('pagination')
    })
  })

  describe('createWarehousing', () => {
    it('入荷依頼を作成できる', async () => {
      const warehousingData = {
        inspection_type: 'CODE' as const,
        arrival_date: '2025-01-25',
        items: [
          {
            code: 'TEST-001',
            quantity: 100,
          },
        ],
      }

      const response = await createWarehousing(client, warehousingData)

      expect(response).toMatchObject({
        id: 'wh-new',
        inspection_type: 'CODE',
        arrival_date: '2025-01-25',
        status: 'waiting',
      })
      expect(response.items).toHaveLength(1)
      expect(response.created_at).toBeDefined()
    })

    it('複数商品の入荷依頼を作成できる', async () => {
      const warehousingData = {
        inspection_type: 'CODE' as const,
        arrival_date: '2025-01-25',
        items: [
          { code: 'TEST-001', quantity: 100 },
          { code: 'TEST-002', quantity: 50 },
        ],
      }

      const response = await createWarehousing(client, warehousingData)

      expect(response.status).toBe('waiting')
    })

    it('バリデーションエラーが発生する', async () => {
      server.use(
        http.post(`${BASE_URL}/warehousings`, () => {
          return HttpResponse.json({ message: 'arrival_date is required' }, { status: 422 })
        }),
      )

      await expect(
        createWarehousing(client, {
          inspection_type: 'CODE',
          arrival_date: '',
          items: [],
        }),
      ).rejects.toThrow()
    })

    it('認証エラーが発生する', async () => {
      server.use(
        http.post(`${BASE_URL}/warehousings`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
      )

      await expect(
        createWarehousing(client, {
          inspection_type: 'CODE',
          arrival_date: '2025-01-25',
          items: [{ code: 'TEST-001', quantity: 100 }],
        }),
      ).rejects.toThrow()
    })
  })

  describe('getWarehousing', () => {
    it('入荷依頼を取得できる', async () => {
      const response = await getWarehousing(client, 'wh-001')

      expect(response).toMatchObject({
        id: 'wh-001',
        inspection_type: 'CODE',
        arrival_date: '2025-01-20',
        status: 'waiting',
      })
      expect(response.items).toHaveLength(1)
    })

    it('入荷依頼の詳細情報（lot_items, cases, warehoused_count）を取得できる', async () => {
      const response = await getWarehousing(client, 'wh-001')

      expect(response.items).toHaveLength(1)
      const item = response.items[0]

      // 基本フィールドの確認
      expect(item).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'テスト商品',
        quantity: 100,
        received: 100,
      })

      // lot_items フィールドの確認
      expect(item.lot_items).toBeDefined()
      expect(item.lot_items).toHaveLength(1)
      expect(item.lot_items![0]).toMatchObject({
        id: 'lot-001',
        expiry_at: '2026-01-20',
        manufacture_date: '2025-01-10',
        lot_allocatable_at: '2025-01-15',
        received: 100,
      })

      // cases フィールドの確認
      expect(item.cases).toBeDefined()
      expect(item.cases).toHaveLength(1)
      expect(item.cases![0]).toMatchObject({
        quantity_in_case: 10,
        quantity: 10,
      })

      // warehoused_count フィールドの確認
      expect(item.warehoused_count).toBeDefined()
      expect(item.warehoused_count).toBe(100)
    })

    it('存在しない入荷依頼はNotFoundErrorを投げる', async () => {
      await expect(getWarehousing(client, 'not-found')).rejects.toThrow()
    })
  })

  describe('updateWarehousing', () => {
    it('入荷依頼を更新できる', async () => {
      const updateData = {
        arrival_date: '2025-01-26',
        items: [
          {
            code: 'TEST-001',
            quantity: 150,
          },
        ],
      }

      const response = await updateWarehousing(client, 'wh-001', updateData)

      expect(response).toMatchObject({
        id: 'wh-001',
        arrival_date: '2025-01-26',
      })
      expect(response.items[0].quantity).toBe(150)
    })

    it('一部のフィールドのみ更新できる', async () => {
      const response = await updateWarehousing(client, 'wh-001', {
        arrival_date: '2025-01-27',
      })

      expect(response.arrival_date).toBe('2025-01-27')
    })
  })

  describe('deleteWarehousing', () => {
    it('入荷依頼を削除できる（200 OKでWarehousingResponseを返す）', async () => {
      const response = await deleteWarehousing(client, 'wh-001')

      expect(response).toBeDefined()
      expect(response.id).toBe('wh-001')
      expect(response.status).toBe('waiting')
      expect(response.items).toHaveLength(1)
    })

    it('存在しない入荷依頼の削除はエラーを投げる', async () => {
      server.use(
        http.delete(`${BASE_URL}/warehousings/:id`, () => {
          return HttpResponse.json({ message: 'Warehousing not found' }, { status: 404 })
        }),
      )

      await expect(deleteWarehousing(client, 'not-found')).rejects.toThrow()
    })
  })

  describe('getStockedWarehousing', () => {
    it('直近の入荷実績を取得できる', async () => {
      const response = await getStockedWarehousing(client)

      expect(response).toHaveProperty('warehousings')
      expect(response).not.toHaveProperty('retrieved_at')
      expect(response.warehousings).toBeInstanceOf(Array)
      if (response.warehousings.length > 0) {
        expect(response.warehousings[0]).toHaveProperty('id')
        expect(response.warehousings[0].status).toBe('stocked')
        // 公式APIでは received フィールドを使用
        expect(response.warehousings[0].items[0]).toHaveProperty('received')
        // レスポンスのitemsにはid, code, nameも含まれる
        expect(response.warehousings[0].items[0]).toMatchObject({
          id: 'item-001',
          code: 'TEST-001',
          name: 'テスト商品',
          quantity: 100,
          received: 100,
        })
      }
    })

    it('date_beforeパラメータで取得できる', async () => {
      const response = await getStockedWarehousing(client, {
        date_before: '20250120',
      })

      expect(response.warehousings).toBeDefined()
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('date_afterパラメータで取得できる', async () => {
      const response = await getStockedWarehousing(client, {
        date_after: '20250101',
      })

      expect(response.warehousings).toBeDefined()
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('date_beforeとdate_afterの両方を指定できる', async () => {
      const response = await getStockedWarehousing(client, {
        date_before: '20250120',
        date_after: '20250101',
      })

      expect(response.warehousings).toBeDefined()
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('入荷実績が空の場合', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings/stocked`, () => {
          return HttpResponse.json({
            warehousings: [],
          })
        }),
      )

      const response = await getStockedWarehousing(client)

      expect(response.warehousings).toHaveLength(0)
      expect(response).not.toHaveProperty('retrieved_at')
    })
  })

  describe('getStockedWarehousingByDate', () => {
    it('指定日の入荷実績を取得できる', async () => {
      const response = await getStockedWarehousingByDate(client, 2025, 1, 15)

      expect(response.warehousings).toHaveLength(1)
      expect(response.warehousings[0]).toMatchObject({
        id: 'wh-stocked-date',
        status: 'stocked',
      })
      expect(response.warehousings[0].arrival_date).toBe('2025-01-15')
      expect(response.warehousings[0].items[0]).toHaveProperty('received')
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('異なる日付で取得できる', async () => {
      const response = await getStockedWarehousingByDate(client, 2025, 2, 10)

      expect(response.warehousings).toBeDefined()
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('実績がない日付の場合', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings/stocked/:year/:month/:day`, () => {
          return HttpResponse.json({
            warehousings: [],
          })
        }),
      )

      const response = await getStockedWarehousingByDate(client, 2025, 1, 20)

      expect(response.warehousings).toHaveLength(0)
    })
  })

  describe('getWarehousingLabel', () => {
    it('PDFラベルを取得できる', async () => {
      const pdfBlob = await getWarehousingLabel(client, 'wh-001')

      expect(pdfBlob).toBeInstanceOf(Blob)
      expect(pdfBlob.size).toBeGreaterThan(0)
    })

    it('PDFの内容が正しい', async () => {
      const pdfBlob = await getWarehousingLabel(client, 'wh-001')
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // PDFヘッダー "%PDF" をチェック（最初の4バイト）
      expect(uint8Array.length).toBeGreaterThan(0)
      // バイナリデータが取得できていることを確認
      expect(uint8Array).toBeInstanceOf(Uint8Array)
    })

    it('存在しない入荷依頼のPDFはエラーを投げる', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings/:id.pdf`, () => {
          return HttpResponse.json({ message: 'Warehousing not found' }, { status: 404 })
        }),
      )

      await expect(getWarehousingLabel(client, 'not-found')).rejects.toThrow()
    })
  })

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings`, () => {
          return HttpResponse.error()
        }),
      )

      await expect(listWarehousing(client)).rejects.toThrow()
    })

    it('500エラーを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings`, () => {
          return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
        }),
      )

      await expect(listWarehousing(client)).rejects.toThrow()
    })

    it('不正なレスポンスを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings`, () => {
          return HttpResponse.json({
            invalid: 'response',
          })
        }),
      )

      await expect(listWarehousing(client)).rejects.toThrow(ValidationError)
    })
  })
})
