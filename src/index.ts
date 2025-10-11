/**
 * OpenLogi API SDK for TypeScript
 *
 * This SDK provides a type-safe interface to interact with the OpenLogi API.
 *
 * @packageDocumentation
 */

export const version = '0.1.0'

// エラークラス
export {
  OpenLogiError,
  ApiError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from './errors.js'

// クライアント
export { createClient, request, type ClientConfig, type OpenLogiClient } from './client.js'

// 型定義
export * from './types/index.js'

// リソースAPI
export * from './resources/items.js'
export * from './resources/warehousings.js'
export * from './resources/shipments.js'
