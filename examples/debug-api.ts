// .envファイルから環境変数を読み込む
import 'dotenv/config'
import { createClient } from 'openlogi-api-sdk'

async function debugApi() {
  const apiToken = process.env.OPENLOGI_API_TOKEN!

  const client = createClient({
    apiToken,
    baseUrl: 'http://localhost:8080',
  })

  try {
    // 最小限のデータで商品を作成
    const response = await client.http.post('items', {
      json: {
        code: `DEBUG-${Date.now()}`,
      },
    })

    const data = await response.json()
    console.log('✅ Success:', JSON.stringify(data, null, 2))
  } catch (error: any) {
    console.error('❌ Error occurred')

    if (error.response) {
      const responseBody = await error.response.text()
      console.error('Response status:', error.response.status)
      console.error('Response body:', responseBody)
    }

    console.error('Full error:', error)
  }
}

debugApi()
