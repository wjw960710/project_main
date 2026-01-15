import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { JSDOM } from 'jsdom'
import { GlobalTimerManager } from './global-timer-manager.ts'

describe('common/global-timer-manager.ts', () => {
	let timerManager: GlobalTimerManager
	let dom: JSDOM

	beforeEach(() => {
		// 建立 JSDOM 實例
		dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
			pretendToBeVisual: true,
		})

		// 將 JSDOM 的 requestAnimationFrame 和 cancelAnimationFrame 設定到 global
		global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
		global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
		global.Date = dom.window.Date as any

		timerManager = new GlobalTimerManager()
	})

	afterEach(() => {
		// 清理
		dom.window.close()
	})

	test('應該能夠訂閱回呼函數', () => {
		const callback = mock(() => {})
		const unsubscribe = timerManager.subscribe(1000, callback)

		expect(typeof unsubscribe).toBe('function')
	})

	test('應該在指定間隔後執行回調', async () => {
		const callback = mock(() => {})
		timerManager.subscribe(100, callback)

		// 等待足夠的時間讓回呼被執行
		await new Promise(resolve => setTimeout(resolve, 150))

		expect(callback).toHaveBeenCalled()
	})

	test('應該能夠取消訂閱', async () => {
		const callback = mock(() => {})
		const unsubscribe = timerManager.subscribe(100, callback)

		// 立即取消訂閱
		unsubscribe()

		// 等待一段時間
		await new Promise(resolve => setTimeout(resolve, 150))

		// 回調不應該被執行
		expect(callback).not.toHaveBeenCalled()
	})

	test('應該支援多個回呼函數使用相同的間隔', async () => {
		const callback1 = mock(() => {})
		const callback2 = mock(() => {})

		timerManager.subscribe(100, callback1)
		timerManager.subscribe(100, callback2)

		await new Promise(resolve => setTimeout(resolve, 150))

		expect(callback1).toHaveBeenCalled()
		expect(callback2).toHaveBeenCalled()
	})

	test('應該支援不同的時間間隔', async () => {
		const callback100 = mock(() => {})
		const callback200 = mock(() => {})

		timerManager.subscribe(100, callback100)
		timerManager.subscribe(200, callback200)

		// 等待 150ms
		await new Promise(resolve => setTimeout(resolve, 150))

		expect(callback100).toHaveBeenCalled()
		expect(callback200).not.toHaveBeenCalled()

		// 再等待 100ms
		await new Promise(resolve => setTimeout(resolve, 100))

		expect(callback200).toHaveBeenCalled()
	})

	test('應該在沒有訂閱者時停止計時器', async () => {
		const callback = mock(() => {})
		const unsubscribe = timerManager.subscribe(100, callback)

		await new Promise(resolve => setTimeout(resolve, 50))

		unsubscribe()

		const callCount = callback.mock.calls.length

		// 等待更長時間
		await new Promise(resolve => setTimeout(resolve, 200))

		// 呼叫次數不應該增加
		expect(callback.mock.calls.length).toBe(callCount)
	})

	test('應該能夠多次執行回調', async () => {
		const callback = mock(() => {})
		timerManager.subscribe(50, callback)

		// 等待足夠的時間讓回調執行多次
		await new Promise(resolve => setTimeout(resolve, 160))

		expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2)
	})

	test('取消訂閱特定回呼不應影響同間隔的其他回呼', async () => {
		const callback1 = mock(() => {})
		const callback2 = mock(() => {})

		const unsubscribe1 = timerManager.subscribe(100, callback1)
		timerManager.subscribe(100, callback2)

		unsubscribe1()

		await new Promise(resolve => setTimeout(resolve, 150))

		expect(callback1).not.toHaveBeenCalled()
		expect(callback2).toHaveBeenCalled()
	})

	test('應該正確累積時間', async () => {
		const callback = mock(() => {})
		const unsubscribe = timerManager.subscribe(100, callback)

		await new Promise(resolve => setTimeout(resolve, 120))

		const firstCallCount = callback.mock.calls.length

		unsubscribe()

		// 重新訂閱
		timerManager.subscribe(100, callback)

		await new Promise(resolve => setTimeout(resolve, 120))

		expect(callback.mock.calls.length).toBeGreaterThan(firstCallCount)
	})

	test('應該處理零訂閱者的情況', () => {
		const callback = mock(() => {})
		const unsubscribe = timerManager.subscribe(100, callback)

		// 立即取消訂閱
		unsubscribe()

		// 不應該拋出錯誤
		expect(() => unsubscribe()).not.toThrow()
	})
})
