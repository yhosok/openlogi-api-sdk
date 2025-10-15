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
        shipment_return: false,
      })
      expect(response.warehousings[0].items).toHaveLength(1)
      // 一覧取得時はreceivedフィールドを含む
      expect(response.warehousings[0].items[0]).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'テスト商品',
        quantity: 100,
        received: 0,
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
      // POST時はshipment_returnフィールドが含まれない
      expect(response).not.toHaveProperty('shipment_return')
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
        status: 'stocked',
        shipment_return: false,
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

    it('waiting状態の入荷依頼はreceivedフィールドが存在しない場合でも取得できる', async () => {
      // 実際のAPIでは、waiting状態の場合receivedフィールドが存在しないことがある
      server.use(
        http.get(`${BASE_URL}/warehousings/:id`, () => {
          return HttpResponse.json({
            id: 'wh-waiting',
            inspection_type: 'CODE',
            arrival_date: '2025-01-20',
            status: 'waiting',
            shipment_return: false,
            items: [
              {
                id: 'item-001',
                code: 'TEST-001',
                name: 'テスト商品',
                quantity: 100,
                // receivedフィールドなし（waiting状態なので未入荷）
              },
            ],
            created_at: '2025-01-10T00:00:00Z',
          })
        }),
      )

      const response = await getWarehousing(client, 'wh-waiting')

      expect(response).toMatchObject({
        id: 'wh-waiting',
        status: 'waiting',
      })
      expect(response.items).toHaveLength(1)
      expect(response.items[0]).toMatchObject({
        id: 'item-001',
        code: 'TEST-001',
        name: 'テスト商品',
        quantity: 100,
      })
      // receivedフィールドはundefinedであるべき
      expect(response.items[0].received).toBeUndefined()
    })
  })

  describe('updateWarehousing', () => {
    it('入荷依頼を更新できる', async () => {
      const updateData = {
        inspection_type: 'CODE',
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
      // PUT時はshipment_returnフィールドが含まれない
      expect(response).not.toHaveProperty('shipment_return')
    })

    it('必須フィールドが欠けているとバリデーションエラーになる', async () => {
      await expect(
        updateWarehousing(client, 'wh-001', {
          arrival_date: '2025-01-27',
        }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteWarehousing', () => {
    it('入荷依頼を削除できる（200 OKでWarehousingResponseを返す）', async () => {
      const response = await deleteWarehousing(client, 'wh-001')

      expect(response).toBeDefined()
      expect(response.id).toBe('wh-001')
      expect(response.status).toBe('waiting')
      expect(response.items).toHaveLength(1)
      // DELETE時はshipment_returnフィールドが含まれない
      expect(response).not.toHaveProperty('shipment_return')
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
        expect(response.warehousings[0]).toMatchObject({
          status: 'stocked',
          shipment_return: false,
        })
        // 公式APIでは received フィールドを使用
        expect(response.warehousings[0].items[0]).toHaveProperty('received')
        expect(response.warehousings[0].items[0]).toHaveProperty('warehoused_count')
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
        shipment_return: false,
      })
      expect(response.warehousings[0].arrival_date).toBe('2025-01-15')
      expect(response.warehousings[0].items[0]).toHaveProperty('received')
      expect(response.warehousings[0].items[0]).toHaveProperty('warehoused_count')
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('年月のみ指定して入荷実績を取得できる', async () => {
      const response = await getStockedWarehousingByDate(client, 2025, 1)

      expect(response.warehousings).toHaveLength(1)
      expect(response.warehousings[0]).toMatchObject({
        id: 'wh-stocked-date',
        status: 'stocked',
        shipment_return: false,
      })
      expect(response.warehousings[0].items[0]).toHaveProperty('received')
      expect(response.warehousings[0].items[0]).toHaveProperty('warehoused_count')
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('異なる日付で取得できる', async () => {
      const response = await getStockedWarehousingByDate(client, 2025, 2, 10)

      expect(response.warehousings).toBeDefined()
      expect(response).not.toHaveProperty('retrieved_at')
    })

    it('実績がない日付の場合', async () => {
      server.use(
        http.get(`${BASE_URL}/warehousings/stocked/:year/:month/:day?`, () => {
          return HttpResponse.json({
            warehousings: [],
          })
        }),
      )

      const response = await getStockedWarehousingByDate(client, 2025, 1, 20)

      expect(response.warehousings).toHaveLength(0)
    })

    describe('入力値バリデーション', () => {
      describe('yearパラメータのバリデーション', () => {
        it('year=1899（下限未満）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 1899, 1, 15)).rejects.toThrow(
            ValidationError,
          )
        })

        it('year=2101（上限超過）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2101, 1, 15)).rejects.toThrow(
            ValidationError,
          )
        })

        it('yearが小数（2025.5）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025.5, 1, 15)).rejects.toThrow(
            ValidationError,
          )
        })

        it('yearが負の値でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, -2025, 1, 15)).rejects.toThrow(
            ValidationError,
          )
        })
      })

      describe('monthパラメータのバリデーション', () => {
        it('month=0（下限未満）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 0, 15)).rejects.toThrow(
            ValidationError,
          )
        })

        it('month=13（上限超過）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 13, 15)).rejects.toThrow(
            ValidationError,
          )
        })

        it('monthが小数（6.5）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 6.5, 15)).rejects.toThrow(
            ValidationError,
          )
        })

        it('monthが負の値でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, -1, 15)).rejects.toThrow(
            ValidationError,
          )
        })
      })

      describe('dayパラメータのバリデーション', () => {
        it('day=0（下限未満）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 1, 0)).rejects.toThrow(
            ValidationError,
          )
        })

        it('day=32（上限超過）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 1, 32)).rejects.toThrow(
            ValidationError,
          )
        })

        it('dayが小数（15.5）でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 1, 15.5)).rejects.toThrow(
            ValidationError,
          )
        })

        it('dayが負の値でValidationErrorを投げる', async () => {
          await expect(getStockedWarehousingByDate(client, 2025, 1, -1)).rejects.toThrow(
            ValidationError,
          )
        })
      })
    })

    describe('境界値テスト（成功ケース）', () => {
      it('year=1900（下限値）で成功する', async () => {
        const response = await getStockedWarehousingByDate(client, 1900, 1, 15)
        expect(response.warehousings).toBeDefined()
      })

      it('year=2100（上限値）で成功する', async () => {
        const response = await getStockedWarehousingByDate(client, 2100, 1, 15)
        expect(response.warehousings).toBeDefined()
      })

      it('month=1（下限値）で成功する', async () => {
        const response = await getStockedWarehousingByDate(client, 2025, 1, 15)
        expect(response.warehousings).toBeDefined()
      })

      it('month=12（上限値）で成功する', async () => {
        const response = await getStockedWarehousingByDate(client, 2025, 12, 15)
        expect(response.warehousings).toBeDefined()
      })

      it('day=1（下限値）で成功する', async () => {
        const response = await getStockedWarehousingByDate(client, 2025, 1, 1)
        expect(response.warehousings).toBeDefined()
      })

      it('day=31（上限値）で成功する', async () => {
        const response = await getStockedWarehousingByDate(client, 2025, 1, 31)
        expect(response.warehousings).toBeDefined()
      })
    })
  })

  describe('getStockedWarehousing - クエリパラメータバリデーション', () => {
    it('不正なdate_beforeフォーマット（"abcd1234"）でValidationErrorを投げる', async () => {
      await expect(
        getStockedWarehousing(client, {
          date_before: 'abcd1234',
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('不正なdate_afterフォーマット（英字混在 "2025ab01"）でValidationErrorを投げる', async () => {
      await expect(
        getStockedWarehousing(client, {
          date_after: '2025ab01',
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('date_beforeが7桁（"2025010"）でValidationErrorを投げる', async () => {
      await expect(
        getStockedWarehousing(client, {
          date_before: '2025010',
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('date_afterが9桁（"202501011"）でValidationErrorを投げる', async () => {
      await expect(
        getStockedWarehousing(client, {
          date_after: '202501011',
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('date_beforeに記号が混在（"2025-01-01"）でValidationErrorを投げる', async () => {
      await expect(
        getStockedWarehousing(client, {
          date_before: '2025-01-01',
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('date_afterが空文字列でValidationErrorを投げる', async () => {
      await expect(
        getStockedWarehousing(client, {
          date_after: '',
        }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('getWarehousingLabel', () => {
    it('PDFラベルを取得できる', async () => {
      const pdfBlob = await getWarehousingLabel(client, 'wh-001')

      expect(pdfBlob).toBeInstanceOf(Blob)
      expect(pdfBlob.size).toBeGreaterThan(0)
    })

    it('PDFの内容が正しい（ヘッダー検証）', async () => {
      const pdfBlob = await getWarehousingLabel(client, 'wh-001')
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      expect(uint8Array.length).toBeGreaterThan(0)
      expect(uint8Array).toBeInstanceOf(Uint8Array)

      // PDFヘッダー "%PDF" をチェック（最初の4バイト: 0x25 0x50 0x44 0x46）
      expect(uint8Array[0]).toBe(0x25) // '%'
      expect(uint8Array[1]).toBe(0x50) // 'P'
      expect(uint8Array[2]).toBe(0x44) // 'D'
      expect(uint8Array[3]).toBe(0x46) // 'F'
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

  describe('createWarehousing - バリデーション詳細テスト', () => {
    describe('items配列のバリデーション', () => {
      it('items配列に重複した商品コードがある場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items: [
            { code: 'TEST-001', quantity: 100 },
            { code: 'TEST-002', quantity: 50 },
            { code: 'TEST-001', quantity: 30 }, // 重複
          ],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('items配列が26個（上限超過）の場合はValidationErrorを投げる', async () => {
        const items = Array.from({ length: 26 }, (_, i) => ({
          code: `TEST-${String(i + 1).padStart(3, '0')}`,
          quantity: 10,
        }))

        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items,
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('items配列が25個ちょうどの場合は成功する', async () => {
        const items = Array.from({ length: 25 }, (_, i) => ({
          code: `TEST-${String(i + 1).padStart(3, '0')}`,
          quantity: 10,
        }))

        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items,
        }

        const response = await createWarehousing(client, warehousingData)
        expect(response.status).toBe('waiting')
        expect(response.items).toHaveLength(25)
      })
    })

    describe('quantityのバリデーション', () => {
      it('quantityが999999999を超える場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items: [
            {
              code: 'TEST-001',
              quantity: 1000000000, // 上限超過
            },
          ],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('quantityが0以下の場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items: [
            {
              code: 'TEST-001',
              quantity: 0, // 0は不正
            },
          ],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('quantityが負の値の場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items: [
            {
              code: 'TEST-001',
              quantity: -1, // 負の値は不正
            },
          ],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('quantityが999999999の場合は成功する', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          items: [
            {
              code: 'TEST-001',
              quantity: 999999999, // 上限値
            },
          ],
        }

        const response = await createWarehousing(client, warehousingData)
        expect(response.status).toBe('waiting')
        expect(response.items[0].quantity).toBe(999999999)
      })
    })

    describe('arrival_timeのバリデーション', () => {
      it('arrival_time_fromがarrival_time_toより大きい場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          arrival_time_from: 18,
          arrival_time_to: 10, // fromより小さい
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('arrival_time_fromが23を超える場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          arrival_time_from: 24, // 上限超過
          arrival_time_to: 23,
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('arrival_time_toが負の値の場合はValidationErrorを投げる', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          arrival_time_from: 10,
          arrival_time_to: -1, // 負の値
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        await expect(createWarehousing(client, warehousingData)).rejects.toThrow(ValidationError)
      })

      it('arrival_time_fromとarrival_time_toが同じ値の場合は成功する', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          arrival_time_from: 14,
          arrival_time_to: 14, // 同じ値
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        const response = await createWarehousing(client, warehousingData)
        expect(response.status).toBe('waiting')
        expect(response.arrival_time_from).toBe(14)
        expect(response.arrival_time_to).toBe(14)
      })

      it('arrival_time_fromが0の場合は成功する', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          arrival_time_from: 0, // 最小値
          arrival_time_to: 10,
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        const response = await createWarehousing(client, warehousingData)
        expect(response.status).toBe('waiting')
        expect(response.arrival_time_from).toBe(0)
      })

      it('arrival_time_toが23の場合は成功する', async () => {
        const warehousingData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-25',
          arrival_time_from: 10,
          arrival_time_to: 23, // 最大値
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        const response = await createWarehousing(client, warehousingData)
        expect(response.status).toBe('waiting')
        expect(response.arrival_time_to).toBe(23)
      })
    })
  })

  describe('updateWarehousing - バリデーション詳細テスト', () => {
    describe('items配列のバリデーション', () => {
      it('items配列に重複した商品コードがある場合はValidationErrorを投げる', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          items: [
            { code: 'TEST-001', quantity: 100 },
            { code: 'TEST-002', quantity: 50 },
            { code: 'TEST-001', quantity: 30 }, // 重複
          ],
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('items配列が26個（上限超過）の場合はValidationErrorを投げる', async () => {
        const items = Array.from({ length: 26 }, (_, i) => ({
          code: `TEST-${String(i + 1).padStart(3, '0')}`,
          quantity: 10,
        }))

        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          items,
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('items配列が25個ちょうどの場合は成功する', async () => {
        const items = Array.from({ length: 25 }, (_, i) => ({
          code: `TEST-${String(i + 1).padStart(3, '0')}`,
          quantity: 10,
        }))

        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          items,
        }

        const response = await updateWarehousing(client, 'wh-001', updateData)
        expect(response.id).toBe('wh-001')
        expect(response.items).toHaveLength(25)
      })
    })

    describe('quantityのバリデーション', () => {
      it('quantityが999999999を超える場合はValidationErrorを投げる', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          items: [
            {
              code: 'TEST-001',
              quantity: 1000000000, // 上限超過
            },
          ],
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('quantityが0以下の場合はValidationErrorを投げる', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          items: [
            {
              code: 'TEST-001',
              quantity: 0, // 0は不正
            },
          ],
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('quantityが999999999の場合は成功する', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          items: [
            {
              code: 'TEST-001',
              quantity: 999999999, // 上限値
            },
          ],
        }

        const response = await updateWarehousing(client, 'wh-001', updateData)
        expect(response.id).toBe('wh-001')
        expect(response.items[0].quantity).toBe(999999999)
      })
    })

    describe('arrival_timeのバリデーション', () => {
      it('arrival_time_fromがarrival_time_toより大きい場合はValidationErrorを投げる', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          arrival_time_from: 18,
          arrival_time_to: 10, // fromより小さい
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('arrival_time_fromが23を超える場合はValidationErrorを投げる', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          arrival_time_from: 24, // 上限超過
          arrival_time_to: 23,
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('arrival_time_toが負の値の場合はValidationErrorを投げる', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          arrival_time_from: 10,
          arrival_time_to: -1, // 負の値
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        await expect(updateWarehousing(client, 'wh-001', updateData)).rejects.toThrow(
          ValidationError,
        )
      })

      it('arrival_time_fromとarrival_time_toが同じ値の場合は成功する', async () => {
        const updateData = {
          inspection_type: 'CODE' as const,
          arrival_date: '2025-01-26',
          arrival_time_from: 14,
          arrival_time_to: 14, // 同じ値
          items: [{ code: 'TEST-001', quantity: 100 }],
        }

        const response = await updateWarehousing(client, 'wh-001', updateData)
        expect(response.id).toBe('wh-001')
        expect(response.arrival_time_from).toBe(14)
        expect(response.arrival_time_to).toBe(14)
      })
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
