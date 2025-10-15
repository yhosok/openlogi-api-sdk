/**
 * Shipments API のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../setup'
import { createClient } from '../../src/client'
import {
  listShipments,
  createShipment,
  bulkCreateShipments,
  getShipment,
  updateShipment,
  deleteShipment,
  modifyShipment,
  cancelShipment,
  listShippedShipments,
  getShippedShipmentByDate,
  getInternationalRegions,
  getInternationalCurrencies,
  clearShipmentAllocation,
  createTransfer,
  updateTransfer,
  modifyTransfer,
  cancelTransfer,
} from '../../src/resources/shipments'
import { ValidationError } from '../../src/errors'

const BASE_URL = 'http://localhost:8080/api'

describe('Shipments API', () => {
  let client: ReturnType<typeof createClient>

  beforeEach(() => {
    client = createClient({
      apiToken: 'test-token',
    })
  })

  describe('listShipments', () => {
    it('出荷依頼一覧を取得できる', async () => {
      const response = await listShipments(client)

      expect(response.shipments).toHaveLength(1)
      expect(response.shipments[0]).toMatchObject({
        id: 'ship-001',
        order_no: 'ORDER-001',
        status: 'PENDING',
        shipping_date: '2025-01-20',
      })
      expect(response.shipments[0].items).toHaveLength(1)
      expect(response.shipments[0].recipient).toMatchObject({
        name: '山田太郎',
        postcode: '1700013',
      })
      expect(response).not.toHaveProperty('pagination')
    })

    it('idクエリパラメータ付きで一覧を取得できる', async () => {
      const response = await listShipments(client, {
        id: 'ship-001,ship-002',
      })

      expect(response.shipments).toBeDefined()
      expect(response).not.toHaveProperty('pagination')
    })
  })

  describe('createShipment', () => {
    it('出荷依頼を作成できる', async () => {
      const shipmentData = {
        order_no: 'ORDER-NEW',
        items: [
          {
            code: 'TEST-001',
            quantity: 1,
          },
        ],
        recipient: {
          name: '田中花子',
          postcode: '1000002',
          prefecture: '東京都',
          address1: '千代田2-2-2',
          phone: '09087654321',
        },
      }

      const response = await createShipment(client, shipmentData)

      expect(response).toMatchObject({
        id: 'ship-new',
        order_no: 'ORDER-NEW',
        status: 'PENDING',
      })
      expect(response.items).toHaveLength(1)
      expect(response.recipient?.name).toBe('田中花子')
      expect(response.created_at).toBeDefined()
      expect(response.updated_at).toBeDefined()
    })

    it('新しいフィールドを使用して出荷依頼を作成できる', async () => {
      const shipmentData = {
        order_no: 'ORDER-NEW-FULL',
        sender: {
          postcode: '1700013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          address2: 'いちご東池袋ビル9F',
          name: '山田 太郎',
          company: 'スライム株式会社',
          division: 'メタル部',
          phone: '0333333333',
        },
        recipient: {
          postcode: '1700013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          address2: 'いちご東池袋ビル9F',
          name: '山田 太郎',
          phone: '0333333333',
        },
        delivery_carrier: 'YAMATO',
        delivery_time_slot: 'AM',
        delivery_method: 'HOME_BOX',
        delivery_options: {
          box_delivery: true,
          fragile_item: true,
        },
        cash_on_delivery: false,
        international: false,
        warehouse: 'OPL',
        backorder_if_unavailable: false,
        total_with_normal_tax: 0,
        total_with_reduced_tax: 1000,
        items: [
          {
            code: 'item-001',
            quantity: 1,
            unit_price: 1000,
            price: 1000,
            is_reduced_tax: true,
            backorder_if_unavailable: false,
          },
        ],
      }

      const response = await createShipment(client, shipmentData)

      expect(response).toMatchObject({
        id: 'ship-new',
        order_no: 'ORDER-NEW-FULL',
        status: 'PENDING',
      })
    })

    it('複数商品の出荷依頼を作成できる', async () => {
      const shipmentData = {
        order_no: 'ORDER-MULTI',
        items: [
          { code: 'TEST-001', quantity: 2 },
          { code: 'TEST-002', quantity: 1 },
        ],
        recipient: {
          name: '山田太郎',
          postcode: '1000001',
          prefecture: '東京都',
          address1: '千代田1-1-1',
          phone: '09012345678',
        },
      }

      const response = await createShipment(client, shipmentData)

      expect(response.status).toBe('PENDING')
    })

    it('バリデーションエラーが発生する', async () => {
      server.use(
        http.post(`${BASE_URL}/shipments`, () => {
          return HttpResponse.json({ message: 'order_no is required' }, { status: 422 })
        }),
      )

      await expect(
        createShipment(client, {
          order_no: '',
          items: [],
        }),
      ).rejects.toThrow()
    })

    it('認証エラーが発生する', async () => {
      server.use(
        http.post(`${BASE_URL}/shipments`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
      )

      await expect(
        createShipment(client, {
          order_no: 'ORDER-001',
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1000001',
            prefecture: '東京都',
            address1: '千代田1-1-1',
            phone: '09012345678',
          },
        }),
      ).rejects.toThrow()
    })
  })

  describe('bulkCreateShipments', () => {
    it('出荷依頼を一括作成できる', async () => {
      const shipmentsData = {
        shipments: [
          {
            order_no: 'ORDER-BULK-1',
            items: [{ code: 'TEST-001', quantity: 1 }],
            recipient: {
              name: '山田太郎',
              postcode: '1000001',
              prefecture: '東京都',
              address1: '千代田1-1-1',
              phone: '09012345678',
            },
          },
          {
            order_no: 'ORDER-BULK-2',
            items: [{ code: 'TEST-002', quantity: 2 }],
            recipient: {
              name: '田中花子',
              postcode: '1000002',
              prefecture: '東京都',
              address1: '千代田2-2-2',
              phone: '09087654321',
            },
          },
        ],
      }

      const response = await bulkCreateShipments(client, shipmentsData)

      expect(response.shipments).toHaveLength(2)
      expect(response.shipments[0].order_no).toBe('ORDER-BULK-1')
      expect(response.shipments[1].order_no).toBe('ORDER-BULK-2')
    })

    it('バリデーションエラーの場合は422が発生する', async () => {
      server.use(
        http.post(`${BASE_URL}/shipments/bulk`, () => {
          return HttpResponse.json({
            error: 'validation_failed',
            error_description: 'items[1].code must exist',
            errors: {
              'shipments.1.items.0.code': ['商品コードが存在しません'],
            },
          }, { status: 422 })
        }),
      )

      await expect(
        bulkCreateShipments(client, {
          shipments: [
            {
              order_no: 'ORDER-BULK-1',
              items: [{ code: 'TEST-001', quantity: 1 }],
              recipient: {
                name: '山田太郎',
                postcode: '1000001',
                prefecture: '東京都',
                address1: '千代田1-1-1',
                phone: '09012345678',
              },
            },
            {
              order_no: 'ORDER-BULK-2',
              items: [{ code: 'INVALID', quantity: 1 }],
              recipient: {
                name: '田中花子',
                postcode: '1000002',
                prefecture: '東京都',
                address1: '千代田2-2-2',
                phone: '09087654321',
              },
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('getShipment', () => {
    it('出荷依頼を取得できる', async () => {
      const response = await getShipment(client, 'ship-001')

      expect(response).toMatchObject({
        id: 'ship-001',
        order_no: 'ORDER-001',
        status: 'PENDING',
        shipping_date: '2025-01-20',
      })
      expect(response.items).toHaveLength(1)
      expect(response.recipient).toBeDefined()
    })

    it('存在しない出荷依頼はNotFoundErrorを投げる', async () => {
      await expect(getShipment(client, 'not-found')).rejects.toThrow()
    })
  })

  describe('updateShipment', () => {
    it('出荷依頼を更新できる', async () => {
      const updateData = {
        shipping_date: '2025-01-25',
      }

      const response = await updateShipment(client, 'ship-001', updateData)

      expect(response).toMatchObject({
        id: 'ship-001',
        shipping_date: '2025-01-25',
      })
      expect(response.updated_at).toBeDefined()
    })

    it('受取人情報を更新できる', async () => {
      const updateData = {
        recipient: {
          name: '鈴木一郎',
          postcode: '1000003',
          prefecture: '東京都',
          address1: '千代田3-3-3',
          phone: '09011112222',
        },
      }

      const response = await updateShipment(client, 'ship-001', updateData)

      expect(response.recipient?.name).toBe('鈴木一郎')
    })
  })

  describe('deleteShipment', () => {
    it('出荷依頼を削除できる', async () => {
      await expect(deleteShipment(client, 'ship-001')).resolves.not.toThrow()
    })

    it('存在しない出荷依頼の削除はエラーを投げる', async () => {
      server.use(
        http.delete(`${BASE_URL}/shipments/:id`, () => {
          return HttpResponse.json({ message: 'Shipment not found' }, { status: 404 })
        }),
      )

      await expect(deleteShipment(client, 'not-found')).rejects.toThrow()
    })
  })

  describe('modifyShipment', () => {
    it('出荷依頼の受取人情報を修正できる', async () => {
      const modifyData = {
        recipient: {
          name: '山田太郎',
          postcode: '1000002',
          prefecture: '東京都',
          address1: '千代田2-2-2',
          phone: '09012345678',
        },
      }

      const response = await modifyShipment(client, 'ship-001', modifyData)

      expect(response).toMatchObject({
        id: 'ship-001',
        status: 'PENDING',
      })
      expect(response.recipient?.address1).toBe('千代田2-2-2')
      expect(response.updated_at).toBeDefined()
    })

    it('配送時間帯を修正できる', async () => {
      const modifyData = {
        delivery_time_slot: '14',
      }

      const response = await modifyShipment(client, 'ship-001', modifyData)

      expect(response.status).toBe('PENDING')
    })

    it('配送希望日を修正できる', async () => {
      const modifyData = {
        delivery_date: '2025-02-01',
      }

      const response = await modifyShipment(client, 'ship-001', modifyData)

      expect(response.status).toBe('PENDING')
    })

    it('複数のフィールドを同時に修正できる', async () => {
      const modifyData = {
        recipient: {
          name: '田中花子',
          postcode: '1000003',
          prefecture: '東京都',
          address1: '千代田3-3-3',
          phone: '09011112222',
        },
        delivery_time_slot: 'AM',
        delivery_date: '2025-02-05',
      }

      const response = await modifyShipment(client, 'ship-001', modifyData)

      expect(response.status).toBe('PENDING')
      expect(response.recipient?.name).toBe('田中花子')
    })
  })

  describe('cancelShipment', () => {
    it('出荷依頼をキャンセルできる', async () => {
      const response = await cancelShipment(client, 'ship-001')

      expect(response).toMatchObject({
        id: 'ship-001',
        status: 'CANCELLED',
      })
      expect(response.cancelled_at).toBeDefined()
    })

    it('既にキャンセル済みの場合はエラーを投げる', async () => {
      server.use(
        http.post(`${BASE_URL}/shipments/:id/cancel`, () => {
          return HttpResponse.json({ message: 'Already cancelled' }, { status: 400 })
        }),
      )

      await expect(cancelShipment(client, 'ship-001')).rejects.toThrow()
    })

    it('存在しない出荷依頼はNotFoundErrorを投げる', async () => {
      server.use(
        http.post(`${BASE_URL}/shipments/:id/cancel`, () => {
          return HttpResponse.json({ message: 'Shipment not found' }, { status: 404 })
        }),
      )

      await expect(cancelShipment(client, 'not-found')).rejects.toThrow()
    })

    it('should send empty JSON body in cancel request', async () => {
      let capturedBody: unknown = undefined

      server.use(
        http.post(`${BASE_URL}/shipments/:id/cancel`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            id: 'ship-001',
            order_no: 'ORDER-001',
            status: 'CANCELLED',
            shipping_date: '2025-01-20',
            items: [{ code: 'TEST-001', quantity: 1 }],
            cancelled_at: '2025-01-11T00:00:00Z',
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-11T00:00:00Z',
          })
        }),
      )

      await cancelShipment(client, 'ship-001')

      // Verify that the request body is an empty JSON object
      expect(capturedBody).toEqual({})
    })
  })

  describe('listShippedShipments', () => {
    it('出荷実績一覧を取得できる', async () => {
      const response = await listShippedShipments(client)

      expect(response.shipments).toHaveLength(1)
      expect(response.shipments[0]).toMatchObject({
        id: 'ship-shipped-001',
        order_no: 'ORDER-SHIPPED-001',
        status: 'SHIPPED',
        shipping_date: '2025-01-15',
      })
      expect(response.shipments[0].shipped_at).toBeDefined()
      expect(response.shipments[0].carrier_info).toBeDefined()
    })

    it('クエリパラメータ付きで取得できる', async () => {
      const response = await listShippedShipments(client, {
        date_before: '20250120',
        date_after: '20250110',
      })

      expect(response.shipments).toBeDefined()
      expect(Array.isArray(response.shipments)).toBe(true)
    })

    it('date_beforeのみ指定できる', async () => {
      const response = await listShippedShipments(client, {
        date_before: '20250120',
      })

      expect(response.shipments).toBeDefined()
    })

    it('date_afterのみ指定できる', async () => {
      const response = await listShippedShipments(client, {
        date_after: '20250110',
      })

      expect(response.shipments).toBeDefined()
    })
  })

  describe('getShippedShipmentByDate', () => {
    it('指定年月日の出荷実績を取得できる', async () => {
      const response = await getShippedShipmentByDate(client, 2025, 1, 20)

      expect(response.shipments).toHaveLength(1)
      expect(response.shipments[0]).toMatchObject({
        id: 'ship-shipped-date',
        order_no: 'ORDER-SHIPPED-DATE',
        status: 'SHIPPED',
        shipping_date: '2025-01-20',
      })
      expect(response.shipments[0].shipped_at).toContain('2025-01-20')
    })

    it('月と日が1桁の場合も正しく処理できる', async () => {
      const response = await getShippedShipmentByDate(client, 2025, 1, 5)

      expect(response.shipments).toHaveLength(1)
      expect(response.shipments[0].shipping_date).toBe('2025-01-05')
    })
  })

  describe('getInternationalRegions', () => {
    it('国コード情報を取得できる', async () => {
      const response = await getInternationalRegions(client)

      expect(response.regions).toHaveLength(3)
      expect(response.regions[0]).toMatchObject({
        code: 'US',
        name: 'アメリカ合衆国',
        name_en: 'United States',
      })
    })

    it('レスポンスに必須フィールドが含まれる', async () => {
      const response = await getInternationalRegions(client)

      response.regions.forEach((region) => {
        expect(region.code).toBeDefined()
        expect(region.name).toBeDefined()
        expect(typeof region.code).toBe('string')
        expect(typeof region.name).toBe('string')
      })
    })
  })

  describe('getInternationalCurrencies', () => {
    it('通貨情報を取得できる', async () => {
      const response = await getInternationalCurrencies(client)

      expect(response.currencies).toHaveLength(4)
      expect(response.currencies[0]).toMatchObject({
        code: 'USD',
        name: '米ドル',
      })
    })

    it('レスポンスに必須フィールドが含まれる', async () => {
      const response = await getInternationalCurrencies(client)

      response.currencies.forEach((currency) => {
        expect(currency.code).toBeDefined()
        expect(currency.name).toBeDefined()
        expect(typeof currency.code).toBe('string')
        expect(typeof currency.name).toBe('string')
      })
    })
  })

  describe('clearShipmentAllocation', () => {
    it('出荷商品の引当を解除できる', async () => {
      const response = await clearShipmentAllocation(client, 'ship-001')

      expect(response).toMatchObject({
        id: 'ship-001',
        status: 'PENDING',
        backorder_if_unavailable: true,
      })
      expect(response.items[0].backordered).toBe(true)
      expect(response.updated_at).toBeDefined()
    })

    it('理由付きで引当を解除できる', async () => {
      const response = await clearShipmentAllocation(client, 'ship-001', {
        reason: '在庫調整のため引当を解除',
      })

      expect(response).toMatchObject({
        id: 'ship-001',
        status: 'PENDING',
      })
    })

    it('存在しない出荷依頼はNotFoundErrorを投げる', async () => {
      server.use(
        http.post(`${BASE_URL}/shipments/allocation/:id/clear`, () => {
          return HttpResponse.json({ message: 'Shipment not found' }, { status: 404 })
        }),
      )

      await expect(clearShipmentAllocation(client, 'not-found')).rejects.toThrow()
    })

    it('空のボディで引当を解除できる', async () => {
      const response = await clearShipmentAllocation(client, 'ship-001', {})

      expect(response.id).toBe('ship-001')
    })
  })

  describe('公式ドキュメントとの互換性', () => {
    it('公式ドキュメントのサンプルJSONと互換性がある', async () => {
      // 公式ドキュメントのリクエストサンプル
      const officialSample = {
        identifier: '2015-00001',
        order_no: '12345-67890',
        sender: {
          postcode: '170-0013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          address2: 'いちご東池袋ビル9F',
          name: '山田 太郎',
          company: 'スライム株式会社',
          division: 'メタル部',
          phone: '03-3333-3333',
        },
        subtotal_amount: 1000,
        delivery_charge: 500,
        handling_charge: 0,
        discount_amount: 0,
        total_amount: 1500,
        total_with_normal_tax: 0,
        total_with_reduced_tax: 1000,
        cushioning_unit: 'ORDER',
        cushioning_type: 'BUBBLE_PACK',
        gift_wrapping_unit: 'ORDER',
        gift_wrapping_type: 'NAVY',
        gift_sender_name: 'オープン太郎',
        shipping_email: 'test@example.com',
        delivery_note_type: 'NOT_INCLUDE_PII',
        price_on_delivery_note: true,
        message: 'お買上げありがとうございます。',
        suspend: false,
        shipping_date: '2019-04-02',
        recipient: {
          postcode: '170-0013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          address2: 'いちご東池袋ビル9F',
          name: '山田 太郎',
          company: 'スライム株式会社',
          division: 'メタル部',
          phone: '03-3333-3333',
        },
        delivery_carrier: 'YAMATO',
        delivery_time_slot: 'AM',
        delivery_date: '2019-04-05',
        cash_on_delivery: false,
        delivery_method: 'HOME_BOX',
        delivery_options: {
          box_delivery: true,
          fragile_item: true,
        },
        warehouse: 'OPL',
        items: [
          {
            code: 'item-001',
            quantity: 1,
            name: '勇者の盾',
            unit_price: 1000,
            price: 1000,
            is_reduced_tax: true,
            backorder_if_unavailable: false,
          },
        ],
        international: false,
      }

      // サンプルデータでリクエストを作成できることを確認
      const response = await createShipment(client, officialSample)

      expect(response).toBeDefined()
      expect(response.id).toBe('ship-new')
    })
  })

  describe('Transfer API', () => {
    describe('createTransfer', () => {
      it('倉庫移動を作成できる', async () => {
        const transferData = {
          warehouse: 'BASE2',
          destination: { warehouse: 'BASE3' },
          items: [{ code: 'item-001', quantity: 1, name: '勇者の盾' }],
        }

        const response = await createTransfer(client, transferData)

        expect(response.id).toBe('transfer-001')
        expect(response.identifier).toBe('2025-00001')
        expect(response.warehouse).toBe('BASE2')
        expect(response.destination?.warehouse).toBe('BASE3')
        expect(response.items).toHaveLength(1)
        expect(response.items[0].code).toBe('item-001')
        expect(response.items[0].quantity).toBe(1)
        expect(response.status).toBe('PENDING')
      })

      it('バリデーションエラーが発生する（空の商品リスト）', async () => {
        const invalidData = {
          warehouse: 'BASE2',
          destination: { warehouse: 'BASE3' },
          items: [], // 空配列はエラー
        }

        await expect(
          createTransfer(client, invalidData as any),
        ).rejects.toThrow(ValidationError)
      })

      it('バリデーションエラーが発生する（移動元倉庫なし）', async () => {
        const invalidData = {
          destination: { warehouse: 'BASE3' },
          items: [{ code: 'item-001', quantity: 1 }],
        }

        await expect(
          createTransfer(client, invalidData as any),
        ).rejects.toThrow(ValidationError)
      })

      it('バリデーションエラーが発生する（移動先倉庫なし）', async () => {
        const invalidData = {
          warehouse: 'BASE2',
          items: [{ code: 'item-001', quantity: 1 }],
        }

        await expect(
          createTransfer(client, invalidData as any),
        ).rejects.toThrow(ValidationError)
      })

      it('数量が1以上である必要がある', async () => {
        const invalidData = {
          warehouse: 'BASE2',
          destination: { warehouse: 'BASE3' },
          items: [{ code: 'item-001', quantity: 0 }],
        }

        await expect(
          createTransfer(client, invalidData as any),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('updateTransfer', () => {
      it('倉庫移動を更新できる', async () => {
        const updateData = {
          destination: { warehouse: 'BASE4' },
          items: [{ code: 'item-002', quantity: 2 }],
        }

        const response = await updateTransfer(client, 'transfer-001', updateData)

        expect(response.id).toBe('transfer-001')
        expect(response.destination?.warehouse).toBe('BASE4')
        expect(response.items).toHaveLength(1)
        expect(response.items[0].code).toBe('item-002')
        expect(response.items[0].quantity).toBe(2)
      })

      it('存在しない倉庫移動はエラーを投げる', async () => {
        server.use(
          http.put(`${BASE_URL}/shipments/transfer/:id`, () => {
            return HttpResponse.json({ message: 'Transfer not found' }, { status: 404 })
          }),
        )

        const updateData = {
          destination: { warehouse: 'BASE4' },
          items: [{ code: 'item-002', quantity: 2 }],
        }

        await expect(updateTransfer(client, 'not-found', updateData)).rejects.toThrow()
      })
    })

    describe('modifyTransfer', () => {
      it('倉庫移動の修正を依頼できる', async () => {
        const modifyData = {
          destination: { warehouse: 'BASE5' },
        }

        const response = await modifyTransfer(client, 'transfer-001', modifyData)

        expect(response.id).toBe('transfer-001')
        expect(response.destination?.warehouse).toBe('BASE5')
        expect(response.status).toBe('PICKING')
      })

      it('移動先倉庫の修正のみ可能', async () => {
        const modifyData = {
          destination: { warehouse: 'BASE5' },
        }

        const response = await modifyTransfer(client, 'transfer-001', modifyData)

        expect(response.destination?.warehouse).toBe('BASE5')
      })

      it('存在しない倉庫移動はエラーを投げる', async () => {
        server.use(
          http.post(`${BASE_URL}/shipments/transfer/:id/modify`, () => {
            return HttpResponse.json({ message: 'Transfer not found' }, { status: 404 })
          }),
        )

        await expect(
          modifyTransfer(client, 'not-found', { destination: { warehouse: 'BASE5' } }),
        ).rejects.toThrow()
      })
    })

    describe('cancelTransfer', () => {
      it('倉庫移動をキャンセルできる', async () => {
        const response = await cancelTransfer(client, 'transfer-001')

        expect(response.id).toBe('transfer-001')
        expect(response.status).toBe('CANCELLED')
        expect(response.cancelled_at).toBeDefined()
      })

      it('存在しない倉庫移動はエラーを投げる', async () => {
        server.use(
          http.post(`${BASE_URL}/shipments/transfer/:id/cancel`, () => {
            return HttpResponse.json({ message: 'Transfer not found' }, { status: 404 })
          }),
        )

        await expect(cancelTransfer(client, 'not-found')).rejects.toThrow()
      })

      it('空のJSONボディでリクエストする', async () => {
        let capturedBody: unknown = undefined

        server.use(
          http.post(`${BASE_URL}/shipments/transfer/:id/cancel`, async ({ request }) => {
            capturedBody = await request.json()
            return HttpResponse.json({
              id: 'transfer-001',
              status: 'CANCELLED',
              items: [
                {
                  code: 'item-001',
                  quantity: 1,
                },
              ],
              cancelled_at: '2025-01-13T00:00:00Z',
            })
          }),
        )

        await cancelTransfer(client, 'transfer-001')

        expect(capturedBody).toEqual({})
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/shipments`, () => {
          return HttpResponse.error()
        }),
      )

      await expect(listShipments(client)).rejects.toThrow()
    })

    it('500エラーを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/shipments`, () => {
          return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
        }),
      )

      await expect(listShipments(client)).rejects.toThrow()
    })

    it('不正なレスポンスを適切に処理する', async () => {
      server.use(
        http.get(`${BASE_URL}/shipments`, () => {
          return HttpResponse.json({
            invalid: 'response',
          })
        }),
      )

      await expect(listShipments(client)).rejects.toThrow(ValidationError)
    })
  })

  describe('Domestic Shipment Validation', () => {
    describe('Domestic Recipient', () => {
      it('should require postcode with valid pattern', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-001',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
            // Missing postcode
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate postcode pattern (7-8 digits)', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-002',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '123', // Invalid: too short
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require prefecture for domestic shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-003',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            // Missing prefecture
            address1: '豊島区東池袋1-34-5',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require address1 for domestic shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-004',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            // Missing address1
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require name for domestic shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-005',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            // Missing name
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate phone length (10-13 characters when provided)', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-006',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
            phone: '123', // Invalid: too short (less than 10 characters)
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should reject phone longer than 13 characters', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-007',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
            phone: '12345678901234', // Invalid: too long (more than 13 characters)
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate company length (<=16 characters)', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-008',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
            company: '株式会社非常に長い会社名テスト社本社', // Invalid: 18 characters (more than 16)
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate address1 + address2 combined length (<=64 characters)', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-009',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5-67-890123456789012345678901234567890',
            address2: '123456789012345678901234567890',
            // Combined length > 64 characters
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })
    })

    describe('Domestic Sender', () => {
      it('should validate sender postcode pattern', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-010',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
          },
          sender: {
            postcode: '12-345', // Invalid pattern
            prefecture: '東京都',
            address1: '渋谷区1-1-1',
            name: '送り主',
            company: '株式会社テスト',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate sender name length (<=15 characters for domestic)', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-011',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
          },
          sender: {
            postcode: '1700013',
            prefecture: '東京都',
            address1: '渋谷区1-1-1',
            name: '非常に長い送り主の名前テストデータ', // Invalid: more than 15 characters
            company: '株式会社テスト',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate sender phone length (<=20 characters for domestic)', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-012',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
          },
          sender: {
            postcode: '1700013',
            prefecture: '東京都',
            address1: '渋谷区1-1-1',
            name: '送り主',
            company: '株式会社テスト',
            phone: '123456789012345678901', // Invalid: more than 20 characters
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should allow company to be optional for domestic sender', async () => {
        const shipmentData = {
          order_no: 'ORDER-DOMESTIC-013',
          international: false,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
          },
          sender: {
            postcode: '1700013',
            prefecture: '東京都',
            address1: '渋谷区1-1-1',
            name: '送り主',
            // company is now optional for domestic sender
          },
        }

        const response = await createShipment(client, shipmentData)
        expect(response).toBeDefined()
        expect(response.id).toBe('ship-new')
      })
    })
  })

  describe('International Shipment Validation', () => {
    describe('International Recipient', () => {
      it('should require region_code for international shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-001',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            // Missing region_code
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate region_code pattern (2-3 uppercase letters)', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-002',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'usa', // Invalid: must be uppercase
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require postcode for international shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-003',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            // Missing postcode
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require city for international shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-004',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            // Missing city
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require address (not address1) for international shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-005',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            // Missing address (international uses 'address' not 'address1')
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require name for international shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-006',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            // Missing name
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require phone for international shipment', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-007',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            // Missing phone (required for international)
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should reject address1/address2 for international shipment (must use address)', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-008',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address1: '123 Main St', // Invalid: should use 'address' for international
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate international address field length constraints', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-009',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address: 'A'.repeat(256), // Invalid: too long (assuming max 255)
            name: 'John Doe',
            phone: '1234567890',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })
    })

    describe('International Sender', () => {
      it('should validate sender name length (<=255 characters for international)', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-010',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
          sender: {
            postcode: '1700013',
            prefecture: '東京都',
            address1: '渋谷区1-1-1',
            name: 'A'.repeat(256), // Invalid: more than 255 characters
            phone: '0333333333',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should validate sender prefecture length (<=9 characters for international)', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-011',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
          sender: {
            postcode: '1700013',
            prefecture: '非常に長い都道府県名', // Invalid: more than 9 characters
            address1: '渋谷区1-1-1',
            name: 'Sender Name',
            phone: '0333333333',
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })

      it('should require phone for international sender', async () => {
        const shipmentData = {
          order_no: 'ORDER-INTL-012',
          international: true,
          items: [{ code: 'TEST-001', quantity: 1 }],
          recipient: {
            region_code: 'US',
            postcode: '10001',
            city: 'New York',
            address: '123 Main St',
            name: 'John Doe',
            phone: '1234567890',
          },
          sender: {
            postcode: '1700013',
            prefecture: '東京都',
            address1: '渋谷区1-1-1',
            name: 'Sender Name',
            // Missing phone (required for international sender)
          },
        }

        await expect(createShipment(client, shipmentData)).rejects.toThrow(ValidationError)
      })
    })
  })

  describe('Identifier-based Shipment API', () => {
    describe('listShipmentsByAccountId', () => {
      it('識別番号を指定して出荷依頼一覧を取得できる', async () => {
        const { listShipmentsByAccountId } = await import('../../src/resources/shipments')
        const response = await listShipmentsByAccountId(client, 'TS001', {
          identifier: '2015-00001,2015-00002',
        })

        expect(response.shipments).toHaveLength(1)
        expect(response.shipments[0].identifier).toBe('2015-00001')
      })

      it('バリデーションエラーが発生する（空の識別番号）', async () => {
        const { listShipmentsByAccountId } = await import('../../src/resources/shipments')
        await expect(
          listShipmentsByAccountId(client, 'TS001', { identifier: '' }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('getShipmentByAccountId', () => {
      it('アカウントIDとidentifierで出荷依頼を取得できる', async () => {
        const { getShipmentByAccountId } = await import('../../src/resources/shipments')
        const response = await getShipmentByAccountId(client, 'TS001', '2015-00001')

        expect(response.id).toBe('ship-by-identifier-001')
        expect(response.identifier).toBe('2015-00001')
        expect(response.status).toBe('PENDING')
      })
    })

    describe('updateShipmentByAccountId', () => {
      it('アカウントIDとidentifierで出荷依頼を更新できる', async () => {
        const { updateShipmentByAccountId } = await import('../../src/resources/shipments')
        const updateData = {
          shipping_date: '2025-01-25',
        }

        const response = await updateShipmentByAccountId(
          client,
          'TS001',
          '2015-00001',
          updateData,
        )

        expect(response.identifier).toBe('2015-00001')
        expect(response.shipping_date).toBe('2025-01-25')
      })
    })

    describe('deleteShipmentByAccountId', () => {
      it('アカウントIDとidentifierで出荷依頼を削除できる', async () => {
        const { deleteShipmentByAccountId } = await import('../../src/resources/shipments')
        await expect(
          deleteShipmentByAccountId(client, 'TS001', '2015-00001'),
        ).resolves.not.toThrow()
      })
    })

    describe('modifyShipmentByAccountId', () => {
      it('アカウントIDとidentifierで出荷依頼を修正できる', async () => {
        const { modifyShipmentByAccountId } = await import('../../src/resources/shipments')
        const modifyData = {
          recipient: {
            name: '田中花子',
            postcode: '1000002',
            prefecture: '東京都',
            address1: '千代田2-2-2',
            phone: '09087654321',
          },
          delivery_time_slot: 'AM',
        }

        const response = await modifyShipmentByAccountId(
          client,
          'TS001',
          '2015-00001',
          modifyData,
        )

        expect(response.identifier).toBe('2015-00001')
        expect(response.status).toBe('PICKING')
      })
    })

    describe('cancelShipmentByAccountId', () => {
      it('アカウントIDとidentifierで出荷依頼をキャンセルできる', async () => {
        const { cancelShipmentByAccountId } = await import('../../src/resources/shipments')
        const response = await cancelShipmentByAccountId(client, 'TS001', '2015-00001')

        expect(response.identifier).toBe('2015-00001')
        expect(response.status).toBe('CANCELLED')
        expect(response.cancelled_at).toBeDefined()
      })
    })
  })
})
