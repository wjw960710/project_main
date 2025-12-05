/**
 * @desc 全域計時器管理器
 */
export class GlobalTimerManager {
  private subscribers: Map<number, Set<() => void>> = new Map()
  private startTime = Date.now()
  private accumulatedTime = 0
  private frameId: number | null = null
  private lastTicks: Map<number, number> = new Map()

  subscribe(interval: number, callback: () => void) {
    if (!this.subscribers.has(interval)) {
      this.subscribers.set(interval, new Set())
      this.lastTicks.set(interval, 0)
    }
    this.subscribers.get(interval)!.add(callback)

    if (!this.frameId) {
      this.start()
    }

    return () => this.unsubscribe(interval, callback)
  }

  private unsubscribe(interval: number, callback: () => void) {
    this.subscribers.get(interval)?.delete(callback)
    if (this.subscribers.get(interval)?.size === 0) {
      this.subscribers.delete(interval)
      this.lastTicks.delete(interval)
    }

    if (this.subscribers.size === 0) {
      this.stop()
    }
  }

  private tick = () => {
    const elapsed = Date.now() - this.startTime + this.accumulatedTime

    this.subscribers.forEach((callbacks, interval) => {
      const lastTick = this.lastTicks.get(interval) || 0
      if (elapsed - lastTick >= interval) {
        callbacks.forEach(callback => callback())
        this.lastTicks.set(interval, elapsed)
      }
    })

    this.frameId = requestAnimationFrame(this.tick)
  }

  private start() {
    this.startTime = Date.now() - this.accumulatedTime
    this.frameId = requestAnimationFrame(this.tick)
  }

  private stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }
}