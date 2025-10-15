/**
 * 完全なワークフローのサンプル
 *
 * このサンプルでは、OpenLogiの典型的な業務フローを示します：
 * 1. 商品の登録
 * 2. 入庫（warehousing）の作成
 * 3. 出庫（shipment）の作成
 * 4. ステータスの確認
 */

// .envファイルから環境変数を読み込む
import 'dotenv/config'

import {
  createClient,
  createItem,
  createWarehousing,
  getWarehousing,
  createShipment,
  getShipment,
  type OpenLogiClient,
} from 'openlogi-api-sdk'

async function main(): Promise<void> {
  // 環境変数のチェック
  const apiToken = process.env.OPENLOGI_API_TOKEN
  if (!apiToken || apiToken === 'your-api-token-here') {
    console.error('❌ エラー: OPENLOGI_API_TOKEN 環境変数が設定されていません')
    console.error('詳細は basic-usage.ts を参照してください')
    process.exit(1)
  }

  const client: OpenLogiClient = createClient({
    apiToken,
    baseUrl: 'http://localhost:8080', // デモ環境の場合
  })

  try {
    console.log('='.repeat(60))
    console.log('🏭 OpenLogi 完全ワークフローサンプル')
    console.log('='.repeat(60))

    // ステップ1: 商品を登録
    console.log('\n📦 ステップ1: 商品を登録')
    console.log('-'.repeat(60))

    const item = await createItem(client, {
      code: `DEMO-${Date.now()}`,
      name: 'デモ商品 - ワイヤレスマウス',
      temperature_zone: 'dry',
      price: 2980,
      // barcode: '4901234567890', // バーコードは正しいチェックディジットが必要
    })

    console.log(`✅ 商品を登録しました`)
    console.log(`   ID: ${item.id}`)
    console.log(`   商品コード: ${item.code}`)
    console.log(`   商品名: ${item.name}`)

    // ステップ2: 入庫を作成
    console.log('\n📥 ステップ2: 入庫を作成')
    console.log('-'.repeat(60))

    const warehousing = await createWarehousing(client, {
      inspection_type: 'CODE', // 検品タイプ（必須: ID, NAME, CODE, BARCODE, LABEL）
      arrival_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3日後
      items: [
        {
          code: item.code, // 商品コードで指定
          quantity: 100, // 100個入庫
        },
      ],
      company_memo: '初回入庫',
    })

    console.log(`✅ 入庫を作成しました`)
    console.log(`   入庫ID: ${warehousing.id}`)
    console.log(`   ステータス: ${warehousing.status}`)
    console.log(`   入庫予定日: ${warehousing.arrival_date}`)
    console.log(`   商品点数: ${warehousing.items.length}`)

    // 入庫詳細を確認
    const warehousingDetail = await getWarehousing(client, warehousing.id)
    console.log(`\n📊 入庫詳細:`)
    console.log(`   検品タイプ: ${warehousingDetail.inspection_type}`)
    console.log(`   入庫商品: ${warehousingDetail.items.map(i => `${i.name} ${i.quantity}個`).join(', ')}`)

    // ステップ3: 出庫を作成
    console.log('\n📤 ステップ3: 出庫を作成')
    console.log('-'.repeat(60))
    console.log('⚠️  注意: 入庫ステータスが「waiting」（入庫待ち）の場合、')
    console.log('   実際の在庫が確保されていないため、出庫作成は失敗します。')
    console.log('   実運用では、入庫が「stocked」（入庫済み）になってから出庫を作成します。')
    console.log('')

    try {
      const shipment = await createShipment(client, {
        identifier: `SHIP-${Date.now()}`, // 識別子（必須）
        shipping_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7日後
        recipient: {
          // 国内配送の受取人情報
          name: '山田太郎',
          postcode: '100-0001',
          prefecture: '東京都',
          address1: '千代田区千代田1-1-1',
          address2: 'マンション101',
          phone: '0312345678',
        },
        items: [
          {
            code: item.code, // 商品コードで指定
            quantity: 5, // 5個出庫
          },
        ],
        message: 'サンプル出荷',
      })

      console.log(`✅ 出庫を作成しました`)
      console.log(`   出庫ID: ${shipment.id}`)
      console.log(`   識別子: ${shipment.identifier}`)
      console.log(`   ステータス: ${shipment.status}`)
      console.log(`   出庫予定日: ${shipment.shipping_date}`)
      console.log(`   配送先: ${shipment.recipient?.name || '未設定'}`)

      // 出庫詳細を確認
      const shipmentDetail = await getShipment(client, shipment.id)
      console.log(`\n📊 出庫詳細:`)
      console.log(`   識別子: ${shipmentDetail.identifier}`)
      console.log(`   出庫商品: ${shipmentDetail.items.map(i => `${i.name || i.code} ${i.quantity}個`).join(', ')}`)
      if (shipmentDetail.recipient && 'prefecture' in shipmentDetail.recipient) {
        console.log(
          `   住所: ${shipmentDetail.recipient.prefecture}${shipmentDetail.recipient.address1}${shipmentDetail.recipient.address2 || ''}`,
        )
      }

      // ステップ4: サマリー表示
      console.log('\n' + '='.repeat(60))
      console.log('✨ ワークフロー完了サマリー')
      console.log('='.repeat(60))
      console.log(`📦 商品: ${item.name} (ID: ${item.id})`)
      console.log(`📥 入庫: ${warehousing.items[0].quantity}個 (ID: ${warehousing.id})`)
      console.log(`📤 出庫: ${shipment.items[0].quantity}個 (ID: ${shipment.id})`)
      console.log(`📊 予定在庫: ${warehousing.items[0].quantity - shipment.items[0].quantity}個`)
      console.log('='.repeat(60))
    } catch (shipmentError) {
      // 在庫不足エラーの場合は想定内のエラーとして処理
      if (shipmentError instanceof Error && shipmentError.message.includes('在庫数が不足')) {
        console.log('⚠️  在庫不足エラー（想定内）:')
        console.log('   入庫ステータスが「waiting」のため、まだ在庫が確保されていません。')
        console.log('   実運用では、倉庫での入庫作業完了後（ステータス: stocked）に')
        console.log('   出庫を作成してください。')
        console.log('')

        // ステップ4: サマリー表示（出庫なし版）
        console.log('\n' + '='.repeat(60))
        console.log('✨ ワークフロー部分完了サマリー')
        console.log('='.repeat(60))
        console.log(`📦 商品: ${item.name} (ID: ${item.id})`)
        console.log(`📥 入庫: ${warehousing.items[0].quantity}個 (ID: ${warehousing.id}, ステータス: ${warehousing.status})`)
        console.log(`📤 出庫: 入庫待ちのため未作成`)
        console.log('')
        console.log('💡 次のステップ:')
        console.log('   1. 倉庫での入庫作業を完了させる（ステータスをstockedにする）')
        console.log('   2. 在庫が確保された後、出庫を作成する')
        console.log('='.repeat(60))
      } else {
        // その他のエラーは再スロー
        throw shipmentError
      }
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
    throw error
  }
}

// サンプルを実行
main().catch((error) => {
  console.error('処理が失敗しました:', error)
  process.exit(1)
})
