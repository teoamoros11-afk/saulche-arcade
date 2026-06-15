export class MemoryProfiler {
  constructor(page) {
    this.page = page
    this.snapshots = []
  }

  async takeSnapshot(label) {
    const mem = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          usedJSHeapSize: performance.memory.usedJSHeapSize,
        }
      }
      return null
    })
    const entry = { label, timestamp: Date.now(), memory: mem }
    this.snapshots.push(entry)
    return entry
  }

  async monitor(seconds = 5, interval = 500) {
    const samples = Math.floor(seconds * 1000 / interval)
    for (let i = 0; i < samples; i++) {
      await this.takeSnapshot(`monitor_${i}`)
      await this.page.waitForTimeout(interval)
    }
    return this.analyzeTrend()
  }

  analyzeTrend() {
    if (this.snapshots.length < 2) return { error: 'Need at least 2 snapshots' }

    const memSnapshots = this.snapshots.filter(s => s.memory)
    if (memSnapshots.length < 2) return { error: 'performance.memory not available (non-Chromium or no permissions)' }

    const first = memSnapshots[0].memory
    const last = memSnapshots[memSnapshots.length - 1].memory
    const delta = last.usedJSHeapSize - first.usedJSHeapSize
    const elapsed = (memSnapshots[memSnapshots.length - 1].timestamp - memSnapshots[0].timestamp) / 1000
    const leakRate = elapsed > 0 ? delta / elapsed : 0

    const values = memSnapshots.map(s => s.memory.usedJSHeapSize)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length

    return {
      snapshots: memSnapshots.length,
      elapsedSeconds: elapsed,
      initial: { usedJSHeapSize: first.usedJSHeapSize, totalJSHeapSize: first.totalJSHeapSize },
      current: { usedJSHeapSize: last.usedJSHeapSize, totalJSHeapSize: last.totalJSHeapSize },
      delta: { bytes: delta, kb: Math.round(delta / 1024), mb: (delta / (1024 * 1024)).toFixed(2) },
      leakRate: { bytesPerSecond: Math.round(leakRate), kbPerMinute: Math.round((leakRate * 60) / 1024) },
      stats: { min, max, avg: Math.round(avg), variance: Math.round(values.reduce((a, v) => a + (v - avg) ** 2, 0) / values.length) },
      leakPossible: delta > 0 && leakRate > 100000
    }
  }

  async detectLeak(repetitions = 20, action) {
    const sizes = []
    for (let i = 0; i < repetitions; i++) {
      if (action) await action(this.page, i)
      const mem = await this.page.evaluate(() => performance.memory?.usedJSHeapSize || 0)
      sizes.push(mem)
    }
    const first = sizes[0]
    const last = sizes[sizes.length - 1]
    const growth = last - first
    const growthPerIteration = repetitions > 0 ? growth / repetitions : 0
    return {
      iterations: repetitions,
      initialSize: first,
      finalSize: last,
      growth,
      growthPerIteration,
      leakDetected: growth > 0 && growthPerIteration > 50000,
      sizes
    }
  }

  reset() {
    this.snapshots = []
  }
}
