/**
 * コアHTTPクライアント
 * kyをラップしたOpenLogi API専用のHTTPクライアント
 *
 * @packageDocumentation
 */

import ky, { type KyInstance, type Options, type HTTPError as KyHTTPError } from 'ky'
import { type ZodType } from 'zod'
import {
  OpenLogiError,
  ApiError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from './errors.js'

/**
 * クライアント設定
 */
export interface ClientConfig {
  /**
   * APIトークン（必須）
   */
  apiToken: string

  /**
   * ベースURL
   * @default 'http://localhost:8080'
   */
  baseUrl?: string

  /**
   * APIバージョン
   * @default '1.5'
   */
  apiVersion?: string

  /**
   * タイムアウト（ミリ秒）
   * @default 30000
   */
  timeout?: number

  /**
   * リトライ設定
   * 数値の場合はリトライ回数、オブジェクトの場合は詳細設定
   * @default { limit: 2, methods: ['get', 'put', 'head', 'delete', 'options', 'trace'], statusCodes: [408, 413, 429, 500, 502, 503, 504] }
   */
  retry?:
    | number
    | {
        limit?: number
        methods?: string[]
        statusCodes?: number[]
        delay?: (_attemptCount: number) => number
        backoffLimit?: number
      }
}

/**
 * OpenLogiクライアント
 */
export interface OpenLogiClient {
  /**
   * クライアント設定
   */
  config: Required<ClientConfig>

  /**
   * kyインスタンス
   */
  http: KyInstance
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:8080',
  apiVersion: '1.5',
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace'] as string[],
    statusCodes: [408, 413, 429, 500, 502, 503, 504] as number[],
  },
}

/**
 * Retry-Afterヘッダーから秒数を取得
 */
function parseRetryAfter(retryAfterHeader: string | null): number | undefined {
  if (!retryAfterHeader) {
    return undefined
  }

  // 秒数の場合
  const seconds = Number.parseInt(retryAfterHeader, 10)
  if (!Number.isNaN(seconds)) {
    return seconds
  }

  // 日付形式の場合
  const retryDate = new Date(retryAfterHeader)
  if (!Number.isNaN(retryDate.getTime())) {
    const now = Date.now()
    const retryTime = retryDate.getTime()
    return Math.max(0, Math.ceil((retryTime - now) / 1000))
  }

  return undefined
}

/**
 * HTTPErrorからカスタムエラーを生成
 */
async function createErrorFromResponse(error: KyHTTPError): Promise<OpenLogiError> {
  const { response } = error
  const statusCode = response.status

  // レスポンスボディを取得（JSON形式を想定）
  let responseBody: unknown
  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      responseBody = await response.json()
    } else {
      responseBody = await response.text()
    }
  } catch {
    // レスポンスボディの取得に失敗した場合は無視
    responseBody = undefined
  }

  // ステータスコード別にエラーを生成
  switch (statusCode) {
    case 401:
      return new AuthenticationError(
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? String(responseBody.message)
          : undefined,
        error,
      )

    case 404:
      return new NotFoundError(
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? String(responseBody.message)
          : undefined,
        error,
      )

    case 429: {
      const retryAfter = parseRetryAfter(response.headers.get('Retry-After'))
      const message =
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? String(responseBody.message)
          : undefined
      return new RateLimitError(message, retryAfter, error)
    }

    case 400:
    case 422: {
      // バリデーションエラー
      const message = `バリデーションエラー: ${
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? responseBody.message
          : 'リクエストデータが不正です'
      }`

      // 簡易的なZodErrorフォーマットに変換
      const zodErrorFormat = {
        issues: [
          {
            path: [],
            message: message,
            code: 'custom',
          },
        ],
      }

      return new ValidationError(message, zodErrorFormat, error)
    }

    default: {
      const message = `APIエラー (${statusCode}): ${
        responseBody && typeof responseBody === 'object' && 'message' in responseBody
          ? responseBody.message
          : response.statusText
      }`
      return new ApiError(message, statusCode, responseBody, error)
    }
  }
}

/**
 * OpenLogiクライアントを作成
 *
 * @param config - クライアント設定
 * @returns OpenLogiクライアントインスタンス
 *
 * @example
 * ```typescript
 * const client = createClient({
 *   apiToken: 'your-api-token',
 *   baseUrl: 'https://api.openlogi.com',
 * })
 * ```
 */
export function createClient(config: ClientConfig): OpenLogiClient {
  // 設定をマージ
  const mergedConfig: Required<ClientConfig> = {
    apiToken: config.apiToken,
    baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    apiVersion: config.apiVersion ?? DEFAULT_CONFIG.apiVersion,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    retry:
      typeof config.retry === 'number'
        ? { ...DEFAULT_CONFIG.retry, limit: config.retry }
        : { ...DEFAULT_CONFIG.retry, ...config.retry },
  }

  // kyインスタンスを作成
  const http = ky.create({
    prefixUrl: `${mergedConfig.baseUrl}/api`,
    timeout: mergedConfig.timeout,
    retry: mergedConfig.retry,
    headers: {
      Authorization: `Bearer ${mergedConfig.apiToken}`,
      'X-Api-Version': mergedConfig.apiVersion,
      'Content-Type': 'application/json',
    },
    hooks: {
      beforeError: [
        async (error) => {
          // HTTPErrorの場合はカスタムエラーに変換
          if (error.name === 'HTTPError') {
            const customError = await createErrorFromResponse(error as KyHTTPError)
            // kyのエラーオブジェクトにカスタムエラーの情報を注入
            error.name = customError.name
            error.message = customError.message
            // カスタムエラーの追加プロパティをerrorオブジェクトに追加
            Object.assign(error, customError)
          }
          return error
        },
      ],
    },
  })

  return {
    config: mergedConfig,
    http,
  }
}

/**
 * APIリクエストを実行し、レスポンスを型安全に取得
 *
 * @param client - OpenLogiクライアント
 * @param schema - レスポンスの検証に使用するZodスキーマ
 * @param path - APIパス（prefixUrlからの相対パス）
 * @param options - kyのオプション
 * @returns 型安全なレスポンスデータ
 *
 * @throws {ValidationError} レスポンスがスキーマと一致しない場合
 * @throws {ApiError} APIエラーが発生した場合
 * @throws {AuthenticationError} 認証エラーが発生した場合
 * @throws {RateLimitError} レート制限エラーが発生した場合
 * @throws {NotFoundError} リソースが見つからない場合
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 *
 * const userSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 * })
 *
 * const user = await request(client, userSchema, 'users/123', {
 *   method: 'GET',
 * })
 * ```
 */
export async function request<T>(
  client: OpenLogiClient,
  schema: ZodType<T>,
  path: string,
  options?: Options,
): Promise<T> {
  try {
    // kyでリクエストを実行
    const response = await client.http(path, options)

    // レスポンスボディのテキストを取得
    const text = await response.text()

    // レスポンスが空の場合（DELETEなど）
    if (!text || text.trim() === '') {
      // z.void()スキーマの場合はundefinedを返す
      const voidResult = schema.safeParse(undefined)
      if (voidResult.success) {
        return voidResult.data
      }
      // それ以外の場合は空オブジェクトを返す
      return {} as T
    }

    // JSONとしてパース
    const json = JSON.parse(text)

    // Zodスキーマで検証
    const result = schema.safeParse(json)

    if (!result.success) {
      throw new ValidationError(
        `レスポンスの検証に失敗しました: ${result.error.message}`,
        result.error,
        result.error,
      )
    }

    return result.data
  } catch (error) {
    // すでにカスタムエラーの場合はそのままスロー
    if (error instanceof OpenLogiError) {
      throw error
    }

    // kyのHTTPErrorの場合（beforeErrorで変換されているはず）
    if (error instanceof Error && 'response' in error) {
      // beforeErrorで変換されたエラーをそのままスロー
      throw error
    }

    // その他のエラーは汎用的なOpenLogiErrorとしてスロー
    throw new OpenLogiError(
      error instanceof Error ? error.message : '不明なエラーが発生しました',
      error,
    )
  }
}
