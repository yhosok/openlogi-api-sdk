/**
 * カスタムエラークラス
 * OpenLogi APIとの通信で発生する各種エラーを型安全に扱う
 *
 * @packageDocumentation
 */

/**
 * OpenLogiの基底エラークラス
 * すべてのカスタムエラーの基底となるクラス
 */
export class OpenLogiError extends Error {
  /**
   * エラーの原因となった元のエラー
   */
  public readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause

    // プロトタイプチェーンを正しく維持
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * APIエラー
 * HTTPステータスコードが示すエラー（2xx以外）
 */
export class ApiError extends OpenLogiError {
  /**
   * HTTPステータスコード
   */
  public readonly statusCode: number

  /**
   * APIからのレスポンスボディ
   */
  public readonly response?: unknown

  constructor(message: string, statusCode: number, response?: unknown, cause?: unknown) {
    super(message, cause)
    this.statusCode = statusCode
    this.response = response
  }
}

/**
 * バリデーションエラー
 * リクエストまたはレスポンスのデータ検証失敗時に発生
 */
export class ValidationError extends OpenLogiError {
  /**
   * Zodによる検証エラーの詳細
   */
  public readonly errors: {
    path: (string | number)[]
    message: string
    code: string
  }[]

  constructor(
    message: string,
    zodError: { issues: Array<{ path: (string | number)[]; message: string; code: string }> },
    cause?: unknown,
  ) {
    super(message, cause)
    this.errors = zodError.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
      code: issue.code,
    }))
  }
}

/**
 * 認証エラー
 * APIトークンが無効または不足している場合に発生（HTTP 401）
 */
export class AuthenticationError extends OpenLogiError {
  public readonly statusCode = 401

  constructor(message = '認証に失敗しました。APIトークンを確認してください。', cause?: unknown) {
    super(message, cause)
  }
}

/**
 * レート制限エラー
 * APIの使用制限を超えた場合に発生（HTTP 429）
 */
export class RateLimitError extends OpenLogiError {
  public readonly statusCode = 429

  /**
   * リトライ可能になるまでの秒数
   * Retry-Afterヘッダーから取得
   */
  public readonly retryAfter: number | undefined

  constructor(
    message = 'APIのレート制限に達しました。しばらく待ってから再試行してください。',
    retryAfter?: number,
    cause?: unknown,
  ) {
    super(message, cause)
    this.retryAfter = retryAfter
  }
}

/**
 * Not Foundエラー
 * 指定されたリソースが存在しない場合に発生（HTTP 404）
 */
export class NotFoundError extends OpenLogiError {
  public readonly statusCode = 404

  constructor(message = '指定されたリソースが見つかりません。', cause?: unknown) {
    super(message, cause)
  }
}
