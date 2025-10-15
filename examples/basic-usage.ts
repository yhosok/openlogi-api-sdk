/**
 * 基本的な使い方のサンプル
 *
 * このサンプルでは、OpenLogi API SDKの基本的な使用方法を示します：
 * - クライアントの初期化
 * - 商品の一覧取得
 * - 商品の詳細取得
 * - 商品の作成
 */

// .envファイルから環境変数を読み込む
import 'dotenv/config'

import {
  createClient,
  listItems,
  getItem,
  createItem,
  type OpenLogiClient,
} from 'openlogi-api-sdk'

async function main(): Promise<void> {
  // 環境変数のチェック
  const apiToken = process.env.OPENLOGI_API_TOKEN
  if (!apiToken || apiToken === 'your-api-token-here') {
    console.error('❌ エラー: OPENLOGI_API_TOKEN 環境変数が設定されていません')
    console.error('')
    console.error('以下のいずれかの方法で設定してください：')
    console.error('')
    console.error('方法1: 環境変数を設定')
    console.error('  export OPENLOGI_API_TOKEN="your-actual-token"')
    console.error('')
    console.error('方法2: .envファイルを作成')
    console.error('  echo "OPENLOGI_API_TOKEN=your-actual-token" > .env')
    console.error('')
    console.error('APIトークンの取得方法：')
    console.error('  https://help.openlogi.com/faq/show/64')
    process.exit(1)
  }

  // 1. クライアントの初期化
  const client: OpenLogiClient = createClient({
    apiToken,
    // オプション設定
    baseUrl: 'http://localhost:8080',
    apiVersion: '1.5', // デフォルト: 1.5
    timeout: 30000, // デフォルト: 30000ms (30秒)
    retry: {
      limit: 2, // デフォルト: 2回リトライ
    },
  })

  try {
    // 2. 新しい商品を作成
    console.log('➕ 新しい商品を作成中...')
    const newItem = await createItem(client, {
      code: `ITEM-${Date.now()}`, // ユニークな商品コード
      name: 'サンプル商品 - ワイヤレスマウス',
      temperature_zone: 'dry', // 常温
      price: 1000,
      // barcode: '4901234567890', // バーコードは正しいチェックディジットが必要
    })

    console.log('✅ 商品を作成しました')
    console.log(`- ID: ${newItem.id}`)
    console.log(`- 商品コード: ${newItem.code}`)
    console.log(`- 商品名: ${newItem.name}`)

    // 3. 作成した商品を含む商品一覧を取得
    // 注: listItemsは商品IDを指定して取得するAPIです
    console.log('\n📦 商品一覧を取得中...')
    const itemsList = await listItems(client, {
      id: newItem.id, // 商品IDを指定（カンマ区切りで複数指定可能）
      stock: 1, // 在庫情報を含める
    })

    console.log(`✅ ${itemsList.items.length}件の商品を取得しました`)

    // 最初の商品を表示
    if (itemsList.items.length > 0) {
      const firstItem = itemsList.items[0]
      console.log('\n取得した商品:')
      console.log(`- ID: ${firstItem.id}`)
      console.log(`- 商品コード: ${firstItem.code}`)
      console.log(`- 商品名: ${firstItem.name}`)
      console.log(`- バーコード: ${firstItem.barcode || 'なし'}`)
      console.log(`- 在庫数: ${firstItem.stock || 0}`)
    }

    // 4. 特定の商品の詳細を取得
    console.log(`\n🔍 商品ID ${newItem.id} の詳細を取得中...`)
    const itemDetail = await getItem(client, newItem.id, {
      stock: 1, // 在庫情報を含める
    })

    console.log('✅ 商品詳細を取得しました')
    console.log(`- 温度帯: ${itemDetail.temperature_zone}`)
    console.log(`- 価格: ¥${itemDetail.price}`)
    console.log(`- 在庫数: ${itemDetail.stock || 0}`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// サンプルを実行
main().catch((error) => {
  console.error('処理が失敗しました:', error)
  process.exit(1)
})
