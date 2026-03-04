import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getByText, getByAltText, waitFor } from '@testing-library/dom'
import '@testing-library/jest-dom/vitest'
import { setupCatApp } from '../../src/__eg__/CatApp'

describe('CatApp 介面互動測試', () => {
	let container: HTMLElement

	beforeEach(() => {
		// 建立一個乾淨的容器
		container = document.createElement('div')
		document.body.appendChild(container)
		setupCatApp(container)

		// Mock fetch
		vi.stubGlobal('fetch', vi.fn())
	})

	afterEach(() => {
		document.body.removeChild(container)
		vi.restoreAllMocks()
	})

	it('初始狀態應該顯示按鈕且不顯示圖片', () => {
		const button = getByText(container, '獲取貓圖片')
		expect(button).toBeInTheDocument()

		const display = container.querySelector('#cat-display')
		expect(display).toBeEmptyDOMElement()
	})

	it('按下去後應該獲取貓圖片並顯示', async () => {
		const mockCatUrl = 'https://cdn2.thecatapi.com/images/3lv.jpg'

		// 設定 Mock 回傳值
		vi.mocked(fetch).mockResolvedValueOnce({
			json: async () => [{ url: mockCatUrl }],
		} as Response)

		const button = getByText(container, '獲取貓圖片')
		button.click()

		// 檢查是否出現載入中狀態
		expect(getByText(container, '載入中...')).toBeInTheDocument()

		// 等待圖片載入完成
		await waitFor(() => {
			const img = getByAltText(container, '貓圖片') as HTMLImageElement
			expect(img).toBeInTheDocument()
			expect(img.src).toBe(mockCatUrl)
		})
	})

	it('當 API 失敗時應該顯示獲取失敗', async () => {
		// 設定 Mock 失敗
		vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'))

		const button = getByText(container, '獲取貓圖片')
		button.click()

		await waitFor(() => {
			expect(getByText(container, '獲取失敗')).toBeInTheDocument()
		})
	})
})
