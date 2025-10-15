/**
 * MSW (Mock Service Worker) セットアップ
 * テストで使用するモックサーバーとハンドラーの設定
 */

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'

// ベースURL
const BASE_URL = 'http://localhost:8080/api'

/**
 * モックハンドラー
 * すべてのAPIエンドポイントのモック定義
 */
export const handlers = [
  // 商品API
  http.get(`${BASE_URL}/items`, ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return HttpResponse.json(
        { error: 'validation_failed', error_description: '`id` is required' },
        { status: 422 },
      )
    }

    const items = id.split(',').map((itemId, index) => ({
      id: itemId,
      code: `TEST-${(index + 1).toString().padStart(3, '0')}`,
      name: `Test Item ${index + 1}`,
      price: '1000',
      temperature_zone: 'dry',
      stock: 100,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z',
    }))

    return HttpResponse.json({
      items,
    })
  }),

  http.post(`${BASE_URL}/items`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'item-new',
      code: body && typeof body === 'object' && 'code' in body ? body.code : 'DEFAULT-CODE',
      name: body && typeof body === 'object' && 'name' in body ? body.name : 'New Item',
      created_at: '2025-01-11T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
      stock: 0,
      ...body,
      price: body && typeof body === 'object' && 'price' in body ? String(body.price) : undefined,
    })
  }),

  http.post(`${BASE_URL}/items/bulk`, async ({ request }) => {
    const body = (await request.json()) as {
      items: Array<{ code: string; name?: string; price?: number | string }>
    }
    return HttpResponse.json({
      items: body.items.map((item, index) => ({
        id: `item-bulk-${index}`,
        code: item.code,
        name: item.name || `Bulk Item ${index + 1}`,
        price: item.price !== undefined ? String(item.price) : undefined,
        created_at: '2025-01-11T00:00:00Z',
        updated_at: '2025-01-11T00:00:00Z',
        stock: 0,
      })),
    })
  }),

  http.get(`${BASE_URL}/items/:id`, ({ request, params }) => {
    const url = new URL(request.url)
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

    const { id } = params
    if (id === 'not-found') {
      return HttpResponse.json({ message: '商品が見つかりません' }, { status: 404 })
    }
    return HttpResponse.json({
      id: id as string,
      code: 'TEST-001',
      name: 'Test Item',
      price: '1000',
      temperature_zone: 'dry',
      stock: 100,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z',
    })
  }),

  http.put(`${BASE_URL}/items/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    const responseBody = {
      id: id as string,
      code: 'TEST-001',
      name: 'Test Item',
      price: '1000',
      temperature_zone: 'dry',
      stock: 100,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
      ...(body ?? {}),
    } as Record<string, unknown>

    if (body && typeof body === 'object' && 'price' in body && body.price !== undefined) {
      responseBody.price = String(body.price)
    }

    return HttpResponse.json(responseBody)
  }),

  http.delete(`${BASE_URL}/items/:id`, () => {
    return HttpResponse.json({
      id: 'item-001',
      code: 'TEST-001',
      name: 'Deleted Item',
      price: '1000',
      temperature_zone: 'dry',
      stock: 0,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
    })
  }),

  http.post(`${BASE_URL}/items/:id/images`, async ({ request, params }) => {
    const { id: _id } = params

    // FormDataの解析を試みる
    try {
      const formData = await request.formData()
      const file = formData.get('file')

      // ファイルが含まれているか検証
      if (!file || !(file instanceof Blob)) {
        return HttpResponse.json({ message: 'file is required' }, { status: 422 })
      }

      // 公式仕様: レスポンスは {id: string} のみ
      return HttpResponse.json({
        id: 'img-001',
      })
    } catch {
      // FormDataの解析に失敗した場合のフォールバック
      // Node.js環境で問題が発生する可能性があるため
      console.warn('FormData parsing failed, using default response')

      // 公式仕様: レスポンスは {id: string} のみ
      return HttpResponse.json({
        id: 'img-001',
      })
    }
  }),

  http.delete(`${BASE_URL}/items/:id/images/:imageId`, () => {
    return HttpResponse.json({})
  }),

  http.post(`${BASE_URL}/items/:accountId/:code/images`, async ({ request }) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file || !(file instanceof Blob)) {
        return HttpResponse.json({ message: 'file is required' }, { status: 422 })
      }
    } catch {
      console.warn('FormData parsing failed, using default response')
    }

    return HttpResponse.json({ id: 'img-002' })
  }),

  http.delete(`${BASE_URL}/items/:accountId/:code/:imageId`, () => {
    return HttpResponse.json({})
  }),

  // 入荷API
  // GET /warehousings - 一覧取得（shipment_return + receivedを含む）
  http.get(`${BASE_URL}/warehousings`, () => {
    return HttpResponse.json({
      warehousings: [
        {
          id: 'wh-001',
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
              received: 0,
            },
          ],
          warehouse: 'warehouse-1',
          warehouse_info: {
            postcode: '1700013',
            address: '東京都豊島区東池袋1-34-5',
            name: 'Main Warehouse',
          },
          create_user: {
            name: 'Test User',
          },
          stock_deadline_date: '2025-02-20',
          inspection_type_label: 'Code Inspection',
          halfway: false,
          created_at: '2025-01-10T00:00:00Z',
        },
      ],
    })
  }),

  // POST /warehousings - 入荷作成（shipment_returnなし）
  http.post(`${BASE_URL}/warehousings`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'wh-new',
      status: 'waiting',
      created_at: '2025-01-11T00:00:00Z',
      ...body,
      items:
        body && typeof body === 'object' && 'items' in body && Array.isArray(body.items)
          ? body.items.map((item: { code: string; quantity: number }, index: number) => ({
              id: `item-${index + 1}`,
              code: item.code,
              name: `商品名-${item.code}`,
              quantity: item.quantity,
            }))
          : [],
    })
  }),

  // GET /warehousings/stocked - 入荷実績一覧（shipment_return + 詳細itemsを含む）
  http.get(`${BASE_URL}/warehousings/stocked`, () => {
    return HttpResponse.json({
      warehousings: [
        {
          id: 'wh-stocked-001',
          inspection_type: 'CODE',
          arrival_date: '2025-01-15',
          status: 'stocked',
          shipment_return: false,
          items: [
            {
              id: 'item-001',
              code: 'TEST-001',
              name: 'テスト商品',
              quantity: 100,
              received: 100,
              warehoused_count: 100,
            },
          ],
          created_at: '2025-01-10T00:00:00Z',
          stocked_at: '2025-01-15T10:00:00Z',
        },
      ],
    })
  }),

  // GET /warehousings/stocked/:year/:month/:day - 指定年月日の入荷実績（shipment_return + 詳細itemsを含む）
  // year, monthのみでも取得可能（dayは任意）
  http.get(`${BASE_URL}/warehousings/stocked/:year/:month/:day?`, ({ params }) => {
    const { year, month, day } = params
    const dateStr = day
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${year}-${String(month).padStart(2, '0')}-01`

    return HttpResponse.json({
      warehousings: [
        {
          id: 'wh-stocked-date',
          inspection_type: 'CODE',
          arrival_date: dateStr,
          status: 'stocked',
          shipment_return: false,
          items: [
            {
              id: 'item-001',
              code: 'TEST-001',
              name: 'テスト商品',
              quantity: 100,
              received: 100,
              warehoused_count: 100,
            },
          ],
          created_at: '2025-01-10T00:00:00Z',
          stocked_at: `${dateStr}T10:00:00Z`,
        },
      ],
    })
  }),

  http.get(`${BASE_URL}/warehousings/:id.pdf`, () => {
    // PDFファイルのモック（バイナリデータを想定）
    const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]) // "%PDF-1.4"
    return new HttpResponse(pdfContent.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  }),

  // GET /warehousings/:id - 入荷詳細取得（shipment_return + 詳細itemsを含む）
  http.get(`${BASE_URL}/warehousings/:id`, ({ params }) => {
    const { id } = params
    if (id === 'not-found') {
      return HttpResponse.json({ message: '入荷依頼が見つかりません' }, { status: 404 })
    }
    return HttpResponse.json({
      id: id as string,
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
          received: 100,
          lot_items: [
            {
              id: 'lot-001',
              expiry_at: '2026-01-20',
              manufacture_date: '2025-01-10',
              lot_allocatable_at: '2025-01-15',
              received: 100,
            },
          ],
          cases: [
            {
              quantity_in_case: 10,
              quantity: 10,
            },
          ],
          warehoused_count: 100,
        },
      ],
      created_at: '2025-01-10T00:00:00Z',
    })
  }),

  // PUT /warehousings/:id - 入荷更新（shipment_returnなし）
  http.put(`${BASE_URL}/warehousings/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    const baseResponse = {
      id: id as string,
      inspection_type: 'CODE',
      arrival_date: '2025-01-20',
      status: 'waiting',
      created_at: '2025-01-10T00:00:00Z',
      ...body,
    }
    // items を最後にセットして、bodyのitemsを上書き
    return HttpResponse.json({
      ...baseResponse,
      items:
        body && typeof body === 'object' && 'items' in body && Array.isArray(body.items)
          ? body.items.map((item: { code: string; quantity: number }, index: number) => ({
              id: `item-${index + 1}`,
              code: item.code,
              name: `商品名-${item.code}`,
              quantity: item.quantity,
            }))
          : [
              {
                id: 'item-001',
                code: 'TEST-001',
                name: 'テスト商品',
                quantity: 100,
              },
            ],
    })
  }),

  // DELETE /warehousings/:id - 入荷削除（shipment_returnなし）
  http.delete(`${BASE_URL}/warehousings/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json(
      {
        id: id as string,
        inspection_type: 'CODE',
        arrival_date: '2025-01-20',
        status: 'waiting',
        items: [
          {
            id: 'item-001',
            code: 'TEST-001',
            name: 'テスト商品',
            quantity: 100,
          },
        ],
        created_at: '2025-01-10T00:00:00Z',
      },
      { status: 200 },
    )
  }),

  // 出荷API
  // 注意: より具体的なパス（/shipments/shipped）を先に定義する必要がある
  // 出荷実績API
  http.get(`${BASE_URL}/shipments/shipped`, () => {
    return HttpResponse.json({
      shipments: [
        {
          id: 'ship-shipped-001',
          order_no: 'ORDER-SHIPPED-001',
          status: 'SHIPPED',
          shipping_date: '2025-01-15',
          shipped_at: '2025-01-15T10:00:00Z',
          items: [
            {
              code: 'TEST-001',
              quantity: 1,
              shipped_quantity: 1,
            },
          ],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
            phone: '0333333333',
          },
          carrier_info: {
            carrier_code: 'YAMATO',
            carrier_name: 'ヤマト運輸',
            tracking_no: '1234567890',
          },
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ],
    })
  }),

  http.get(`${BASE_URL}/shipments/shipped/:year/:month/:day`, ({ params }) => {
    const { year, month, day } = params
    return HttpResponse.json({
      shipments: [
        {
          id: 'ship-shipped-date',
          order_no: 'ORDER-SHIPPED-DATE',
          status: 'SHIPPED',
          shipping_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          shipped_at: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`,
          items: [
            {
              code: 'TEST-001',
              quantity: 1,
              shipped_quantity: 1,
            },
          ],
          recipient: {
            name: '山田太郎',
            postcode: '1700013',
            prefecture: '東京都',
            address1: '豊島区東池袋1-34-5',
            phone: '0333333333',
          },
          carrier_info: {
            carrier_code: 'YAMATO',
            carrier_name: 'ヤマト運輸',
            tracking_no: '1234567890',
          },
          created_at: '2025-01-10T00:00:00Z',
          updated_at: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`,
        },
      ],
    })
  }),

  // 倉庫移動API（具体的なパスを先に定義）
  http.post(`${BASE_URL}/shipments/transfer`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'transfer-001',
      identifier: '2025-00001',
      status: 'PENDING',
      created_at: '2025-01-13T00:00:00Z',
      updated_at: '2025-01-13T00:00:00Z',
      ...body,
    })
  }),

  http.put(`${BASE_URL}/shipments/transfer/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    return HttpResponse.json({
      id: id as string,
      status: 'PENDING',
      updated_at: '2025-01-13T00:00:00Z',
      ...body,
    })
  }),

  http.post(`${BASE_URL}/shipments/transfer/:id/modify`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    return HttpResponse.json({
      id: id as string,
      status: 'PICKING',
      items: [
        {
          code: 'item-001',
          quantity: 1,
        },
      ],
      updated_at: '2025-01-13T00:00:00Z',
      ...body,
    })
  }),

  http.post(`${BASE_URL}/shipments/transfer/:id/cancel`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id: id as string,
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

  // 国際発送情報API
  http.get(`${BASE_URL}/shipments/international/regions/ems`, () => {
    return HttpResponse.json({
      regions: [
        {
          code: 'US',
          name: 'アメリカ合衆国',
          name_en: 'United States',
        },
        {
          code: 'GB',
          name: 'イギリス',
          name_en: 'United Kingdom',
        },
        {
          code: 'CN',
          name: '中国',
          name_en: 'China',
        },
      ],
    })
  }),

  http.get(`${BASE_URL}/shipments/international/currencies`, () => {
    return HttpResponse.json({
      currencies: [
        {
          code: 'USD',
          name: '米ドル',
        },
        {
          code: 'EUR',
          name: 'ユーロ',
        },
        {
          code: 'GBP',
          name: '英ポンド',
        },
        {
          code: 'CNY',
          name: '中国元',
        },
      ],
    })
  }),

  // 引当解除API
  http.post(`${BASE_URL}/shipments/allocation/:id/clear`, async ({ params, request }) => {
    const { id } = params
    try {
      await request.json()
    } catch {
      // bodyがない場合もOK
    }
    return HttpResponse.json({
      id: id as string,
      order_no: 'ORDER-001',
      status: 'PENDING',
      shipping_date: '2025-01-20',
      backorder_if_unavailable: true,
      items: [
        {
          code: 'TEST-001',
          quantity: 1,
          backordered: true, // 引当解除後は在庫待ち
        },
      ],
      recipient: {
        name: '山田太郎',
        postcode: '1700013',
        prefecture: '東京都',
        address1: '豊島区東池袋1-34-5',
        phone: '0333333333',
      },
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
    })
  }),

  // identifier指定の出荷依頼取得（2セグメント）
  http.get(`${BASE_URL}/shipments/:accountId/:identifier`, ({ params }) => {
    const { accountId: _accountId, identifier } = params
    return HttpResponse.json({
      id: 'ship-by-identifier-001',
      identifier: identifier as string,
      order_no: 'ORDER-IDENTIFIER-001',
      status: 'PENDING',
      items: [{ code: 'TEST-001', quantity: 1 }],
      recipient: {
        name: '山田太郎',
        postcode: '1700013',
        prefecture: '東京都',
        address1: '豊島区東池袋1-34-5',
        phone: '0333333333',
      },
      created_at: '2025-01-13T00:00:00Z',
      updated_at: '2025-01-13T00:00:00Z',
    })
  }),

  // identifier指定の出荷依頼一覧取得 OR 通常の出荷依頼一覧 OR ID指定の出荷依頼取得
  // identifierクエリパラメータの有無で判定
  http.get(`${BASE_URL}/shipments/:idOrAccountId?`, ({ params, request }) => {
    const { idOrAccountId } = params
    const url = new URL(request.url)
    const identifiers = url.searchParams.get('identifier')

    // identifierクエリパラメータがあり、かつパスパラメータがある場合
    // → identifier指定の出荷依頼一覧取得
    if (identifiers && idOrAccountId) {
      return HttpResponse.json({
        shipments: [
          {
            id: 'ship-by-identifier-001',
            identifier: identifiers?.split(',')[0] || '2015-00001',
            order_no: 'ORDER-IDENTIFIER-001',
            status: 'PENDING',
            items: [{ code: 'TEST-001', quantity: 1 }],
            recipient: {
              name: '山田太郎',
              postcode: '1700013',
              prefecture: '東京都',
              address1: '豊島区東池袋1-34-5',
              phone: '0333333333',
            },
            created_at: '2025-01-13T00:00:00Z',
            updated_at: '2025-01-13T00:00:00Z',
          },
        ],
      })
    }

    // パスパラメータがなく、identifierもない場合
    // → 通常の出荷依頼一覧取得
    if (!idOrAccountId) {
      return HttpResponse.json({
        shipments: [
          {
            id: 'ship-001',
            order_no: 'ORDER-001',
            status: 'PENDING',
            shipping_date: '2025-01-20',
            items: [
              {
                code: 'TEST-001',
                quantity: 1,
                unit_price: 1000,
                price: 1000,
              },
            ],
            recipient: {
              name: '山田太郎',
              postcode: '1700013',
              prefecture: '東京都',
              address1: '豊島区東池袋1-34-5',
              address2: 'いちご東池袋ビル9F',
              phone: '0333333333',
            },
            delivery_carrier: 'YAMATO',
            delivery_time_slot: 'AM',
            international: false,
            created_at: '2025-01-10T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z',
          },
        ],
      })
    }

    // パスパラメータがあり、identifierがない場合
    // → ID指定の出荷依頼取得（単一オブジェクト）
    const id = idOrAccountId
    if (id === 'not-found') {
      return HttpResponse.json({ message: '出荷依頼が見つかりません' }, { status: 404 })
    }
    return HttpResponse.json({
      id: id as string,
      order_no: 'ORDER-001',
      status: 'PENDING',
      shipping_date: '2025-01-20',
      items: [
        {
          code: 'TEST-001',
          quantity: 1,
        },
      ],
      recipient: {
        name: '山田太郎',
        postcode: '1700013',
        prefecture: '東京都',
        address1: '豊島区東池袋1-34-5',
        phone: '0333333333',
      },
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z',
    })
  }),

  // 一括作成API（/shipments/bulk を先に定義）
  http.post(`${BASE_URL}/shipments/bulk`, async ({ request }) => {
    const body = (await request.json()) as {
      shipments: Array<{ order_no: string }>
    }
    return HttpResponse.json({
      shipments: body.shipments.map((shipment, index) => ({
        id: `ship-bulk-${index}`,
        status: 'PENDING',
        created_at: '2025-01-11T00:00:00Z',
        updated_at: '2025-01-11T00:00:00Z',
        ...shipment,
      })),
    })
  }),

  http.post(`${BASE_URL}/shipments`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'ship-new',
      status: 'PENDING',
      created_at: '2025-01-11T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
      ...body,
    })
  }),

  // PUT /shipments/:id - ID指定の出荷依頼更新
  http.put(`${BASE_URL}/shipments/:idOrAccountId/:identifier?`, async ({ params, request }) => {
    const { idOrAccountId, identifier } = params
    const body = await request.json()

    // 2セグメント（accountId + identifier）の場合
    if (identifier) {
      return HttpResponse.json({
        id: 'ship-by-identifier-001',
        identifier: identifier as string,
        status: 'PENDING',
        updated_at: '2025-01-13T00:00:00Z',
        items: [{ code: 'TEST-001', quantity: 1 }],
        recipient: {
          name: '山田太郎',
          postcode: '1700013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          phone: '0333333333',
        },
        ...body,
      })
    }

    // 1セグメント（ID）の場合
    return HttpResponse.json({
      id: idOrAccountId as string,
      order_no: 'ORDER-001',
      status: 'PENDING',
      shipping_date: '2025-01-20',
      items: [
        {
          code: 'TEST-001',
          quantity: 1,
        },
      ],
      recipient: {
        name: '山田太郎',
        postcode: '1700013',
        prefecture: '東京都',
        address1: '豊島区東池袋1-34-5',
        phone: '0333333333',
      },
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
      ...body,
    })
  }),

  // DELETE /shipments/:id - ID指定の出荷依頼削除
  http.delete(`${BASE_URL}/shipments/:idOrAccountId/:identifier?`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /shipments/:id/modify - ID指定の出荷依頼修正
  http.post(`${BASE_URL}/shipments/:idOrAccountId/:identifierOrAction/:action?`, async ({ params, request }) => {
    const { idOrAccountId, identifierOrAction, action } = params
    const body = await request.json()

    // 3セグメント（accountId + identifier + action）の場合
    if (action) {
      const modifications =
        body && typeof body === 'object' && 'modifications' in body ? body.modifications : {}

      if (action === 'modify') {
        return HttpResponse.json({
          id: 'ship-by-identifier-001',
          identifier: identifierOrAction as string,
          status: 'PICKING',
          items: [{ code: 'TEST-001', quantity: 1 }],
          updated_at: '2025-01-13T00:00:00Z',
          ...modifications,
        })
      } else if (action === 'cancel') {
        return HttpResponse.json({
          id: 'ship-by-identifier-001',
          identifier: identifierOrAction as string,
          status: 'CANCELLED',
          items: [{ code: 'TEST-001', quantity: 1 }],
          cancelled_at: '2025-01-13T00:00:00Z',
        })
      }
    }

    // 2セグメント（ID + action）の場合
    const idParam = idOrAccountId
    const actionParam = identifierOrAction

    if (actionParam === 'modify') {
      const modifications =
        body && typeof body === 'object' && 'modifications' in body ? body.modifications : {}
      return HttpResponse.json({
        id: idParam as string,
        order_no: 'ORDER-001',
        status: 'PENDING',
        shipping_date: '2025-01-20',
        items: [
          {
            code: 'TEST-001',
            quantity: 1,
          },
        ],
        recipient: {
          name: '山田太郎',
          postcode: '1700013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          phone: '0333333333',
        },
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-11T00:00:00Z',
        ...modifications,
      })
    } else if (actionParam === 'cancel') {
      return HttpResponse.json({
        id: idParam as string,
        order_no: 'ORDER-001',
        status: 'CANCELLED',
        shipping_date: '2025-01-20',
        items: [
          {
            code: 'TEST-001',
            quantity: 1,
            unit_price: 1000,
            price: 1000,
          },
        ],
        recipient: {
          name: '山田太郎',
          postcode: '1700013',
          prefecture: '東京都',
          address1: '豊島区東池袋1-34-5',
          phone: '0333333333',
        },
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-11T00:00:00Z',
        cancelled_at: '2025-01-11T00:00:00Z',
      })
    }

    return HttpResponse.json({ message: 'Unknown action' }, { status: 400 })
  }),
]

// モックサーバーをセットアップ
export const server = setupServer(...handlers)

// テストセットアップ
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
