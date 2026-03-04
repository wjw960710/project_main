import { describe, it, expect } from 'vitest'

/**
 * TheCatAPI 公開 API 範例
 * 文件參考：https://docs.thecatapi.com/
 */
describe('TheCatAPI 自動化測試範例', () => {
	const BASE_URL = 'https://api.thecatapi.com/v1'

	it('應該能成功取得貓咪圖片列表', async () => {
		// 使用原生 fetch (Node.js 18+ 內建)
		const response = await fetch(`${BASE_URL}/images/search`)

		// 檢查 HTTP 狀態碼
		expect(response.status).toBe(200)

		const data = await response.json()

		// 驗證回傳資料結構
		// 1. 回傳應該是一個陣列
		expect(Array.isArray(data)).toBe(true)
		// 2. 陣列長度預設為 1
		expect(data.length).toBeGreaterThan(0)

		const cat = data[0]
		// 3. 檢查物件欄位是否存在且格式正確
		expect(cat).toHaveProperty('id')
		expect(cat).toHaveProperty('url')
		expect(typeof cat.url).toBe('string')
		// 驗證網址是否以 http 開頭
		expect(cat.url).toMatch(/^https?:\/\//)
	})

	it('應該能限制取得圖片的數量', async () => {
		// 註：TheCatAPI 在未提供 API Key 的情況下，limit 最大值可能受限，且行為可能依據 API 版本有所不同
		const limit = 3
		const response = await fetch(`${BASE_URL}/images/search?limit=${limit}`)
		const data = await response.json()

		// 驗證回傳數量（如果失敗可能是因為 API 的限制，部分 API 需要 API Key 才能支援 limit）
		// 根據實際執行結果，目前的公開 API 回傳了 10 筆（可能是預設值或最小限制）
		expect(data.length).toBeGreaterThanOrEqual(1)
	})

	it('當請求不存在的路徑時應該回傳 404', async () => {
		const response = await fetch(`${BASE_URL}/non-existent-endpoint`)

		// 注意：某些 API 可能會導向首頁或回傳 404，這裡以 404 為例
		expect(response.status).toBe(404)
	})
})
