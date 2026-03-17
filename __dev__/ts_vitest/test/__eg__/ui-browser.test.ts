import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { setupCatApp } from '@/__eg__/CatApp.ts'

describe('CatApp Browser Mode 測試', () => {
	beforeEach(() => {
		// 每次測試前 Mock fetch
		// 在瀏覽器模式下，stubGlobal 同樣有效
		vi.stubGlobal('fetch', vi.fn())
	})

	it('應該能在瀏覽器中渲染並點擊按鈕獲取圖片', async () => {
		// 準備渲染容器
		const container = document.createElement('div')
		document.body.appendChild(container)
		setupCatApp(container)

		const mockCatUrl = 'https://cdn2.thecatapi.com/images/3lv.jpg'

		// 設定 Mock 回傳值
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => [{ url: mockCatUrl }],
		} as Response)

		// 取得按鈕並點擊
		const button = container.querySelector('#fetch-btn') as HTMLButtonElement
		await userEvent.click(button)

		// 檢查「載入中」文字是否出現（可選，因為非同步可能很快過期）
		// 檢查圖片是否最終顯示在 DOM 中
		// 使用瀏覽器模式的 waitFor (這裡直接用原生等待或 vitest 的 waitFor)

		const checkImage = () => {
			const img = container.querySelector('img') as HTMLImageElement
			return img && img.src === mockCatUrl
		}

		// 等待圖片渲染
		await vi.waitFor(
			() => {
				if (!checkImage()) throw new Error('圖片尚未顯示或網址不正確')
			},
			{ timeout: 2000 },
		)

		const img = container.querySelector('img') as HTMLImageElement
		expect(img).not.toBeNull()
		expect(img.src).toBe(mockCatUrl)
	})

	it('API 失敗時顯示獲取失敗 (Browser)', async () => {
		const container = document.createElement('div')
		document.body.appendChild(container)
		setupCatApp(container)

		vi.mocked(fetch).mockRejectedValueOnce(new Error('Browser API Error'))

		const button = container.querySelector('#fetch-btn') as HTMLButtonElement
		await userEvent.click(button)

		await vi.waitFor(() => {
			if (!container.textContent?.includes('獲取失敗')) throw new Error('未顯示失敗訊息')
		})

		expect(container.textContent).toContain('獲取失敗')
	})
})
