/**
 * エラークラスのテスト
 */

import { describe, it, expect } from 'vitest'
import {
  OpenLogiError,
  ApiError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../src/errors'

describe('エラークラス', () => {
  describe('OpenLogiError', () => {
    it('基本的なエラーメッセージを持つ', () => {
      const error = new OpenLogiError('テストエラー')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(OpenLogiError)
      expect(error.name).toBe('OpenLogiError')
      expect(error.message).toBe('テストエラー')
      expect(error.cause).toBeUndefined()
    })

    it('原因エラーを保持できる', () => {
      const cause = new Error('原因エラー')
      const error = new OpenLogiError('テストエラー', cause)

      expect(error.cause).toBe(cause)
    })

    it('プロトタイプチェーンが正しく維持される', () => {
      const error = new OpenLogiError('テストエラー')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof OpenLogiError).toBe(true)
      expect(Object.getPrototypeOf(error)).toBe(OpenLogiError.prototype)
    })

    it('スタックトレースを持つ', () => {
      const error = new OpenLogiError('テストエラー')

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('OpenLogiError')
    })
  })

  describe('ApiError', () => {
    it('ステータスコードとレスポンスを保持する', () => {
      const response = { error: 'test error', code: 'ERR001' }
      const error = new ApiError('APIエラー', 500, response)

      expect(error).toBeInstanceOf(OpenLogiError)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('APIエラー')
      expect(error.statusCode).toBe(500)
      expect(error.response).toBe(response)
    })

    it('レスポンスなしで作成できる', () => {
      const error = new ApiError('APIエラー', 500)

      expect(error.statusCode).toBe(500)
      expect(error.response).toBeUndefined()
    })

    it('原因エラーを保持できる', () => {
      const cause = new Error('HTTP Error')
      const error = new ApiError('APIエラー', 500, {}, cause)

      expect(error.cause).toBe(cause)
    })

    it('様々なステータスコードに対応', () => {
      const error400 = new ApiError('Bad Request', 400)
      const error403 = new ApiError('Forbidden', 403)
      const error500 = new ApiError('Internal Server Error', 500)
      const error503 = new ApiError('Service Unavailable', 503)

      expect(error400.statusCode).toBe(400)
      expect(error403.statusCode).toBe(403)
      expect(error500.statusCode).toBe(500)
      expect(error503.statusCode).toBe(503)
    })
  })

  describe('ValidationError', () => {
    it('Zodエラーの詳細を保持する', () => {
      const zodError = {
        issues: [
          {
            path: ['field1'],
            message: 'Required',
            code: 'invalid_type',
          },
          {
            path: ['field2', 0, 'nested'],
            message: 'Must be a string',
            code: 'invalid_type',
          },
        ],
      }
      const error = new ValidationError('検証エラー', zodError)

      expect(error).toBeInstanceOf(OpenLogiError)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('検証エラー')
      expect(error.errors).toHaveLength(2)
      expect(error.errors[0]).toEqual({
        path: ['field1'],
        message: 'Required',
        code: 'invalid_type',
      })
      expect(error.errors[1]).toEqual({
        path: ['field2', 0, 'nested'],
        message: 'Must be a string',
        code: 'invalid_type',
      })
    })

    it('単一のエラーを保持できる', () => {
      const zodError = {
        issues: [
          {
            path: ['email'],
            message: 'Invalid email format',
            code: 'invalid_string',
          },
        ],
      }
      const error = new ValidationError('メール形式が不正です', zodError)

      expect(error.errors).toHaveLength(1)
      expect(error.errors[0].path).toEqual(['email'])
      expect(error.errors[0].message).toBe('Invalid email format')
    })

    it('空のパスを持つエラーを保持できる', () => {
      const zodError = {
        issues: [
          {
            path: [],
            message: 'Root level error',
            code: 'custom',
          },
        ],
      }
      const error = new ValidationError('ルートレベルエラー', zodError)

      expect(error.errors[0].path).toEqual([])
    })

    it('原因エラーを保持できる', () => {
      const cause = new Error('Parse Error')
      const zodError = {
        issues: [
          {
            path: ['field'],
            message: 'Invalid',
            code: 'custom',
          },
        ],
      }
      const error = new ValidationError('検証エラー', zodError, cause)

      expect(error.cause).toBe(cause)
    })
  })

  describe('AuthenticationError', () => {
    it('デフォルトメッセージで作成される', () => {
      const error = new AuthenticationError()

      expect(error).toBeInstanceOf(OpenLogiError)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.name).toBe('AuthenticationError')
      expect(error.statusCode).toBe(401)
      expect(error.message).toContain('認証に失敗')
      expect(error.message).toContain('APIトークン')
    })

    it('カスタムメッセージで作成できる', () => {
      const error = new AuthenticationError('トークンの有効期限が切れています')

      expect(error.message).toBe('トークンの有効期限が切れています')
      expect(error.statusCode).toBe(401)
    })

    it('原因エラーを保持できる', () => {
      const cause = new Error('Token expired')
      const error = new AuthenticationError('認証エラー', cause)

      expect(error.cause).toBe(cause)
    })
  })

  describe('RateLimitError', () => {
    it('デフォルトメッセージで作成される', () => {
      const error = new RateLimitError()

      expect(error).toBeInstanceOf(OpenLogiError)
      expect(error).toBeInstanceOf(RateLimitError)
      expect(error.name).toBe('RateLimitError')
      expect(error.statusCode).toBe(429)
      expect(error.message).toContain('レート制限')
      expect(error.retryAfter).toBeUndefined()
    })

    it('リトライ可能時間を保持できる', () => {
      const error = new RateLimitError(undefined, 60)

      expect(error.retryAfter).toBe(60)
      expect(error.statusCode).toBe(429)
    })

    it('カスタムメッセージとリトライ時間で作成できる', () => {
      const error = new RateLimitError('1時間後に再試行してください', 3600)

      expect(error.message).toBe('1時間後に再試行してください')
      expect(error.retryAfter).toBe(3600)
    })

    it('原因エラーを保持できる', () => {
      const cause = new Error('Rate limit exceeded')
      const error = new RateLimitError('レート制限エラー', 120, cause)

      expect(error.cause).toBe(cause)
      expect(error.retryAfter).toBe(120)
    })

    it('retryAfterが0でも保持できる', () => {
      const error = new RateLimitError(undefined, 0)

      expect(error.retryAfter).toBe(0)
    })
  })

  describe('NotFoundError', () => {
    it('デフォルトメッセージで作成される', () => {
      const error = new NotFoundError()

      expect(error).toBeInstanceOf(OpenLogiError)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.name).toBe('NotFoundError')
      expect(error.statusCode).toBe(404)
      expect(error.message).toContain('見つかりません')
    })

    it('カスタムメッセージで作成できる', () => {
      const error = new NotFoundError('指定された商品は存在しません')

      expect(error.message).toBe('指定された商品は存在しません')
      expect(error.statusCode).toBe(404)
    })

    it('原因エラーを保持できる', () => {
      const cause = new Error('Resource not found')
      const error = new NotFoundError('リソースエラー', cause)

      expect(error.cause).toBe(cause)
    })
  })

  describe('エラーの継承関係', () => {
    it('すべてのカスタムエラーがOpenLogiErrorを継承している', () => {
      const apiError = new ApiError('API', 500)
      const validationError = new ValidationError('Validation', {
        issues: [],
      })
      const authError = new AuthenticationError()
      const rateLimitError = new RateLimitError()
      const notFoundError = new NotFoundError()

      expect(apiError instanceof OpenLogiError).toBe(true)
      expect(validationError instanceof OpenLogiError).toBe(true)
      expect(authError instanceof OpenLogiError).toBe(true)
      expect(rateLimitError instanceof OpenLogiError).toBe(true)
      expect(notFoundError instanceof OpenLogiError).toBe(true)
    })

    it('すべてのカスタムエラーがErrorを継承している', () => {
      const apiError = new ApiError('API', 500)
      const validationError = new ValidationError('Validation', {
        issues: [],
      })
      const authError = new AuthenticationError()
      const rateLimitError = new RateLimitError()
      const notFoundError = new NotFoundError()

      expect(apiError instanceof Error).toBe(true)
      expect(validationError instanceof Error).toBe(true)
      expect(authError instanceof Error).toBe(true)
      expect(rateLimitError instanceof Error).toBe(true)
      expect(notFoundError instanceof Error).toBe(true)
    })

    it('異なるエラークラス間でinstanceofが正しく動作する', () => {
      const apiError = new ApiError('API', 500)
      const authError = new AuthenticationError()

      expect(apiError instanceof ApiError).toBe(true)
      expect(apiError instanceof AuthenticationError).toBe(false)
      expect(authError instanceof AuthenticationError).toBe(true)
      expect(authError instanceof ApiError).toBe(false)
    })
  })

  describe('エラーのシリアライズ', () => {
    it('JSON.stringifyで変換できる', () => {
      const error = new ApiError('APIエラー', 500, { error: 'test' })
      const json = JSON.stringify(error)

      expect(json).toBeDefined()
      // エラーオブジェクトのカスタムプロパティが含まれることを確認
      const parsed = JSON.parse(json)
      expect(parsed.statusCode).toBe(500)
      expect(parsed.response).toEqual({ error: 'test' })
    })

    it('ValidationErrorのerrorsがシリアライズされる', () => {
      const error = new ValidationError('検証エラー', {
        issues: [
          {
            path: ['field'],
            message: 'Required',
            code: 'required',
          },
        ],
      })
      const json = JSON.stringify(error)
      const parsed = JSON.parse(json)

      expect(parsed.errors).toHaveLength(1)
      expect(parsed.errors[0].path).toEqual(['field'])
    })
  })
})
