/**
 * エラーハンドリングのサンプル
 *
 * このサンプルでは、OpenLogi API SDKでのエラーハンドリング方法を示します：
 * - 認証エラー
 * - バリデーションエラー
 * - 404エラー（リソースが見つからない）
 * - レート制限エラー
 * - 一般的なAPIエラー
 */

// .envファイルから環境変数を読み込む
import 'dotenv/config'

import {
  createClient,
  getItem,
  createItem,
  OpenLogiError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ApiError,
  type OpenLogiClient,
} from 'openlogi-api-sdk'

async function demonstrateErrorHandling(): Promise<void> {
  // 環境変数のチェック
  const apiToken = process.env.OPENLOGI_API_TOKEN
  if (!apiToken || apiToken === 'your-api-token-here') {
    console.error('❌ エラー: OPENLOGI_API_TOKEN 環境変数が設定されていません')
    console.error('詳細は basic-usage.ts を参照してください')
    process.exit(1)
  }

  const client: OpenLogiClient = createClient({
    apiToken,
    baseUrl: 'http://localhost:8080',
  })

  console.log('='.repeat(60))
  console.log('🛡️  エラーハンドリングのサンプル')
  console.log('='.repeat(60))

  // 例1: 404エラー（リソースが見つからない）
  console.log('\n📌 例1: 存在しない商品IDを取得')
  console.log('-'.repeat(60))
  try {
    await getItem(client, 'non-existent-id')
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log('✅ NotFoundErrorを正しくキャッチしました')
      console.log(`   メッセージ: ${error.message}`)
      console.log(`   ステータスコード: ${error.statusCode}`)
    } else {
      console.log('❌ 予期しないエラータイプです')
    }
  }

  // 例2: バリデーションエラー
  console.log('\n📌 例2: 不正なデータで商品を作成')
  console.log('-'.repeat(60))
  try {
    await createItem(client, {
      code: '', // 空の商品コード（バリデーションエラー）
      name: 'テスト商品',
      barcode: '123', // 不正なバーコード
      temperature_zone: 'dry',
      price: -100, // 負の価格（バリデーションエラー）
    } as any)
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✅ ValidationErrorを正しくキャッチしました')
      console.log(`   メッセージ: ${error.message}`)
      if (error.errors) {
        console.log(`   検証エラー詳細:`)
        error.errors.forEach((err) => {
          console.log(`     - ${err.path.join('.')}: ${err.message}`)
        })
      }
    } else {
      console.log('❌ 予期しないエラータイプです')
    }
  }

  // 例3: 認証エラー
  console.log('\n📌 例3: 無効なAPIトークンで接続')
  console.log('-'.repeat(60))
  try {
    const invalidClient = createClient({
      apiToken: 'invalid-token-12345',
      baseUrl: 'https://api.openlogi.com',
    })
    await getItem(invalidClient, 'some-id')
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('✅ AuthenticationErrorを正しくキャッチしました')
      console.log(`   メッセージ: ${error.message}`)
      console.log(`   ステータスコード: ${error.statusCode}`)
    } else {
      console.log('❌ 予期しないエラータイプです')
    }
  }

  // 例4: レート制限エラー
  console.log('\n📌 例4: レート制限エラーのハンドリング')
  console.log('-'.repeat(60))
  console.log('💡 レート制限に達した場合の処理例:')
  console.log(`
  try {
    await createItem(client, itemData)
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(\`レート制限に達しました。\${error.retryAfter}秒後に再試行してください。\`)
      // error.retryAfter秒待ってから再試行
      await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000))
      await createItem(client, itemData) // 再試行
    }
  }
  `)

  // 例5: 包括的なエラーハンドリング
  console.log('\n📌 例5: 包括的なエラーハンドリングパターン')
  console.log('-'.repeat(60))

  async function safeApiCall<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      console.log(`❌ ${operationName}でエラーが発生:`)

      // 型ごとに適切なハンドリング
      if (error instanceof AuthenticationError) {
        console.log('   🔐 認証エラー: APIトークンを確認してください')
        console.log(`   詳細: ${error.message}`)
      } else if (error instanceof ValidationError) {
        console.log('   ⚠️  バリデーションエラー: 入力データを確認してください')
        if (error.errors) {
          error.errors.forEach((err) => {
            console.log(`     - ${err.path.join('.')}: ${err.message}`)
          })
        }
      } else if (error instanceof NotFoundError) {
        console.log('   🔍 リソースが見つかりません')
        console.log(`   詳細: ${error.message}`)
      } else if (error instanceof RateLimitError) {
        console.log(`   ⏱️  レート制限: ${error.retryAfter}秒後に再試行してください`)
      } else if (error instanceof ApiError) {
        console.log(`   🌐 APIエラー (${error.statusCode})`)
        console.log(`   詳細: ${error.message}`)
      } else if (error instanceof OpenLogiError) {
        console.log('   ❌ OpenLogiエラー')
        console.log(`   詳細: ${error.message}`)
      } else {
        console.log('   💥 予期しないエラー')
        console.log(`   詳細: ${error}`)
      }

      return null
    }
  }

  // 包括的なエラーハンドリングの使用例
  const result = await safeApiCall(
    () => getItem(client, 'test-id'),
    '商品取得',
  )

  if (result) {
    console.log(`✅ 商品を取得しました: ${result.name}`)
  } else {
    console.log('⚠️  商品の取得に失敗しました（エラーは処理済み）')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ エラーハンドリングのベストプラクティス:')
  console.log('='.repeat(60))
  console.log('1. 具体的なエラー型でキャッチして適切に処理')
  console.log('2. ValidationErrorの場合はzodErrorで詳細を確認')
  console.log('3. RateLimitErrorの場合はretryAfterを使用して再試行')
  console.log('4. AuthenticationErrorの場合は認証情報を再確認')
  console.log('5. フォールバック処理で予期しないエラーにも対応')
  console.log('='.repeat(60))
}

// サンプルを実行
demonstrateErrorHandling().catch((error) => {
  console.error('サンプルの実行に失敗しました:', error)
  process.exit(1)
})
