/**
 * Items スキーマのバリデーションテスト
 * OpenAPI仕様との整合性を確認
 */

import { describe, it, expect } from 'vitest'
import {
  CreateItemRequestSchema,
  UpdateItemRequestSchema,
  ItemResponseSchema,
  ItemInternationalInfoSchema,
  ListItemsByAccountIdQuerySchema,
} from '../../src/types/items'

describe('Items Schemas Validation', () => {
  describe('CreateItemRequestSchema', () => {
    it('有効な商品作成リクエストを受け入れる', () => {
      const validData = {
        code: 'TEST-001',
        name: 'Test Item',
        price: 1000,
      }

      const result = CreateItemRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('imagesフィールドを含む場合は拒否する（画像は別エンドポイント）', () => {
      const invalidData = {
        code: 'TEST-001',
        images: [{ url: 'https://example.com/image.jpg' }],
      }

      const result = CreateItemRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('item_barcodesフィールドを含む場合は拒否する（レスポンス専用）', () => {
      const invalidData = {
        code: 'TEST-001',
        item_barcodes: ['BARCODE-001'],
      }

      const result = CreateItemRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('bundled_itemフィールドを含む場合は拒否する（更新リクエスト専用）', () => {
      const invalidData = {
        code: 'TEST-001',
        bundled_item: true,
      }

      const result = CreateItemRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('codeが必須である', () => {
      const invalidData = {
        name: 'Test Item',
        price: 1000,
      }

      const result = CreateItemRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('codeが1-30文字である', () => {
      const tooLongCode = {
        code: 'A'.repeat(31),
      }

      const result = CreateItemRequestSchema.safeParse(tooLongCode)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateItemRequestSchema', () => {
    it('有効な商品更新リクエストを受け入れる', () => {
      const validData = {
        name: 'Updated Item',
        price: 1500,
      }

      const result = UpdateItemRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('bundled_itemフィールドを受け入れる（更新時のみ使用可能）', () => {
      const validData = {
        name: 'Updated Item',
        bundled_item: true,
      }

      const result = UpdateItemRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('すべてのフィールドがoptionalである', () => {
      const emptyData = {}

      const result = UpdateItemRequestSchema.safeParse(emptyData)
      expect(result.success).toBe(true)
    })

    it('codeを更新できる', () => {
      const validData = {
        code: 'NEW-CODE',
      }

      const result = UpdateItemRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('ItemInternationalInfoSchema', () => {
    it('有効な国際情報を受け入れる', () => {
      const validData = {
        invoice_summary: 'Toy',
        origin: 'JP',
      }

      const result = ItemInternationalInfoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('invoice_summaryは3文字以上75文字以下である', () => {
      const tooShort = {
        invoice_summary: 'AB',
        origin: 'JP',
      }
      expect(ItemInternationalInfoSchema.safeParse(tooShort).success).toBe(false)

      const tooLong = {
        invoice_summary: 'A'.repeat(76),
        origin: 'JP',
      }
      expect(ItemInternationalInfoSchema.safeParse(tooLong).success).toBe(false)

      const valid = {
        invoice_summary: 'ABC',
        origin: 'JP',
      }
      expect(ItemInternationalInfoSchema.safeParse(valid).success).toBe(true)
    })

    it('originは大文字2文字のみ受け入れる', () => {
      const lowercase = {
        invoice_summary: 'Toy',
        origin: 'jp',
      }
      expect(ItemInternationalInfoSchema.safeParse(lowercase).success).toBe(false)

      const tooLong = {
        invoice_summary: 'Toy',
        origin: 'JPN',
      }
      expect(ItemInternationalInfoSchema.safeParse(tooLong).success).toBe(false)

      const valid = {
        invoice_summary: 'Toy',
        origin: 'JP',
      }
      expect(ItemInternationalInfoSchema.safeParse(valid).success).toBe(true)
    })
  })

  describe('ItemResponseSchema', () => {
    it('有効な商品レスポンスを受け入れる', () => {
      const validData = {
        id: 'ITEM-001',
        code: 'TEST-001',
        name: 'Test Item',
      }

      const result = ItemResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('nameは必須である', () => {
      const invalidData = {
        id: 'ITEM-001',
        code: 'TEST-001',
      }

      const result = ItemResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('追加フィールドを受け入れる', () => {
      const validData = {
        id: 'ITEM-001',
        code: 'TEST-001',
        name: 'Test Item',
        description: '玩具',
        externalCode: 'FNSKU123',
        hidden: false,
        expiry_at: '2026-01-20T00:00:00Z',
        manufacture_date: '2025-01-10',
        lot_allocatable_at: '2025-01-15T00:00:00Z',
        lot_allocatable_priority: 1,
        stocks: [],
      }

      const result = ItemResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('descriptionは最大16文字である', () => {
      const tooLong = {
        id: 'ITEM-001',
        code: 'TEST-001',
        name: 'Test Item',
        description: 'あ'.repeat(17),
      }

      const result = ItemResponseSchema.safeParse(tooLong)
      expect(result.success).toBe(false)
    })
  })

  describe('ListItemsByAccountIdQuerySchema', () => {
    it('identifierのみで有効である', () => {
      const validData = {
        identifier: 'ID-001,ID-002',
      }

      const result = ListItemsByAccountIdQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('codeのみで有効である', () => {
      const validData = {
        code: 'CODE-001,CODE-002',
      }

      const result = ListItemsByAccountIdQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('identifierとcodeの両方を指定できる', () => {
      const validData = {
        identifier: 'ID-001',
        code: 'CODE-001',
      }

      const result = ListItemsByAccountIdQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('identifierもcodeも指定しない場合は無効である', () => {
      const invalidData = {}

      const result = ListItemsByAccountIdQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('stockパラメータを含められる', () => {
      const validData = {
        identifier: 'ID-001',
        stock: 1,
      }

      const result = ListItemsByAccountIdQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})
