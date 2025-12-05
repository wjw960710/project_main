import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { JSDOM } from 'jsdom'
import { GlobalTimerManager } from './global-timer-manager.ts'

describe('common/global-timer-manager.ts', () => {
  let timerManager: GlobalTimerManager
  let dom: JSDOM

  beforeEach(() => {
    // 创建 JSDOM 实例
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      pretendToBeVisual: true,
    })

    // 将 JSDOM 的 requestAnimationFrame 和 cancelAnimationFrame 设置到 global
    global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
    global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
    global.Date = dom.window.Date as any

    timerManager = new GlobalTimerManager()
  })

  afterEach(() => {
    // 清理
    dom.window.close()
  })

  test('应该能够订阅回调函数', () => {
    const callback = mock(() => {})
    const unsubscribe = timerManager.subscribe(1000, callback)

    expect(typeof unsubscribe).toBe('function')
  })

  test('应该在指定间隔后执行回调', async () => {
    const callback = mock(() => {})
    timerManager.subscribe(100, callback)

    // 等待足够的时间让回调被执行
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(callback).toHaveBeenCalled()
  })

  test('应该能够取消订阅', async () => {
    const callback = mock(() => {})
    const unsubscribe = timerManager.subscribe(100, callback)

    // 立即取消订阅
    unsubscribe()

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 150))

    // 回调不应该被执行
    expect(callback).not.toHaveBeenCalled()
  })

  test('应该支持多个回调函数使用相同的间隔', async () => {
    const callback1 = mock(() => {})
    const callback2 = mock(() => {})

    timerManager.subscribe(100, callback1)
    timerManager.subscribe(100, callback2)

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(callback1).toHaveBeenCalled()
    expect(callback2).toHaveBeenCalled()
  })

  test('应该支持不同的时间间隔', async () => {
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

  test('应该在没有订阅者时停止计时器', async () => {
    const callback = mock(() => {})
    const unsubscribe = timerManager.subscribe(100, callback)

    await new Promise(resolve => setTimeout(resolve, 50))

    unsubscribe()

    const callCount = callback.mock.calls.length

    // 等待更长时间
    await new Promise(resolve => setTimeout(resolve, 200))

    // 调用次数不应该增加
    expect(callback.mock.calls.length).toBe(callCount)
  })

  test('应该能够多次执行回调', async () => {
    const callback = mock(() => {})
    timerManager.subscribe(50, callback)

    // 等待足够的时间让回调执行多次
    await new Promise(resolve => setTimeout(resolve, 160))

    expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  test('取消订阅特定回调不应影响同间隔的其他回调', async () => {
    const callback1 = mock(() => {})
    const callback2 = mock(() => {})

    const unsubscribe1 = timerManager.subscribe(100, callback1)
    timerManager.subscribe(100, callback2)

    unsubscribe1()

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalled()
  })

  test('应该正确累积时间', async () => {
    const callback = mock(() => {})
    const unsubscribe = timerManager.subscribe(100, callback)

    await new Promise(resolve => setTimeout(resolve, 120))

    const firstCallCount = callback.mock.calls.length

    unsubscribe()

    // 重新订阅
    timerManager.subscribe(100, callback)

    await new Promise(resolve => setTimeout(resolve, 120))

    expect(callback.mock.calls.length).toBeGreaterThan(firstCallCount)
  })

  test('应该处理零订阅者的情况', () => {
    const callback = mock(() => {})
    const unsubscribe = timerManager.subscribe(100, callback)

    // 立即取消订阅
    unsubscribe()

    // 不应该抛出错误
    expect(() => unsubscribe()).not.toThrow()
  })
})