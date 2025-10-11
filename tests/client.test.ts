/**
 * クライアント機能のテスト
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  createClient,
  request,
  OpenLogiError,
  ApiError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  type ClientConfig,
} from '../src/index.js'

describe('createClient', () => {
  it('必須パラメータのみで作成できる', () => {
    const config: ClientConfig = {
      apiToken: 'test-token',
    }

    const client = createClient(config)

    expect(client.config.apiToken).toBe('test-token')
    expect(client.config.baseUrl).toBe('http://localhost:8080')
    expect(client.config.apiVersion).toBe('1.5')
    expect(client.config.timeout).toBe(30000)
    expect(client.http).toBeDefined()
  })

  it('カスタム設定で作成できる', () => {
    const config: ClientConfig = {
      apiToken: 'custom-token',
      baseUrl: 'https://api.example.com',
      apiVersion: '2.0',
      timeout: 60000,
      retry: 5,
    }

    const client = createClient(config)

    expect(client.config.apiToken).toBe('custom-token')
    expect(client.config.baseUrl).toBe('https://api.example.com')
    expect(client.config.apiVersion).toBe('2.0')
    expect(client.config.timeout).toBe(60000)
    expect(typeof client.config.retry).toBe('object')
    if (typeof client.config.retry === 'object') {
      expect(client.config.retry.limit).toBe(5)
    }
  })

  it('詳細なリトライ設定が可能', () => {
    const config: ClientConfig = {
      apiToken: 'test-token',
      retry: {
        limit: 3,
        methods: ['get', 'post'],
        statusCodes: [500, 502],
        backoffLimit: 5000,
      },
    }

    const client = createClient(config)

    expect(typeof client.config.retry).toBe('object')
    if (typeof client.config.retry === 'object') {
      expect(client.config.retry.limit).toBe(3)
      expect(client.config.retry.methods).toEqual(['get', 'post'])
      expect(client.config.retry.statusCodes).toEqual([500, 502])
      expect(client.config.retry.backoffLimit).toBe(5000)
    }
  })
})

describe('エラークラス', () => {
  it('OpenLogiError が正しく生成される', () => {
    const error = new OpenLogiError('テストエラー')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(OpenLogiError)
    expect(error.name).toBe('OpenLogiError')
    expect(error.message).toBe('テストエラー')
    expect(error.cause).toBeUndefined()
  })

  it('OpenLogiError が原因を保持できる', () => {
    const cause = new Error('原因エラー')
    const error = new OpenLogiError('テストエラー', cause)

    expect(error.cause).toBe(cause)
  })

  it('ApiError が正しく生成される', () => {
    const response = { error: 'test' }
    const error = new ApiError('APIエラー', 500, response)

    expect(error).toBeInstanceOf(OpenLogiError)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.statusCode).toBe(500)
    expect(error.response).toBe(response)
  })

  it('ValidationError が正しく生成される', () => {
    const zodError = {
      issues: [
        {
          path: ['field1'],
          message: 'Required',
          code: 'invalid_type',
        },
      ],
    }
    const error = new ValidationError('検証エラー', zodError)

    expect(error).toBeInstanceOf(OpenLogiError)
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.name).toBe('ValidationError')
    expect(error.errors).toHaveLength(1)
    expect(error.errors[0].path).toEqual(['field1'])
    expect(error.errors[0].message).toBe('Required')
  })

  it('AuthenticationError が正しく生成される', () => {
    const error = new AuthenticationError()

    expect(error).toBeInstanceOf(OpenLogiError)
    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error.statusCode).toBe(401)
    expect(error.message).toContain('認証に失敗')
  })

  it('RateLimitError が正しく生成される', () => {
    const error = new RateLimitError(undefined, 60)

    expect(error).toBeInstanceOf(OpenLogiError)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.statusCode).toBe(429)
    expect(error.retryAfter).toBe(60)
    expect(error.message).toContain('レート制限')
  })

  it('NotFoundError が正しく生成される', () => {
    const error = new NotFoundError()

    expect(error).toBeInstanceOf(OpenLogiError)
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.statusCode).toBe(404)
    expect(error.message).toContain('見つかりません')
  })
})

describe('型安全性', () => {
  it('ClientConfig の型が正しく定義されている', () => {
    // TypeScriptの型チェックがコンパイル時に実行される
    const config: ClientConfig = {
      apiToken: 'test',
    }

    // オプショナルパラメータも型チェックされる
    const fullConfig: ClientConfig = {
      apiToken: 'test',
      baseUrl: 'https://example.com',
      apiVersion: '1.0',
      timeout: 10000,
      retry: {
        limit: 3,
        methods: ['get'],
        statusCodes: [500],
      },
    }

    expect(config).toBeDefined()
    expect(fullConfig).toBeDefined()
  })

  it('request関数が型パラメータを受け取れる', () => {
    // TypeScriptの型チェックがコンパイル時に実行される
    const schema = z.object({
      id: z.number(),
      name: z.string(),
    })

    type User = z.infer<typeof schema>

    // この関数の戻り値の型はPromise<User>として推論される
    const client = createClient({ apiToken: 'test' })
    const userPromise: Promise<User> = request(client, schema, 'users/1')

    expect(userPromise).toBeDefined()
  })
})
