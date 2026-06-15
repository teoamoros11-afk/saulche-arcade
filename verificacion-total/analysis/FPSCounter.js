export class FPSCounter {
  constructor(page) {
    this.page = page
  }

  async measure(seconds = 5) {
    return this.page.evaluate((duration) => {
      return new Promise((resolve) => {
        const frames = []
        let lastTime = performance.now()
        let rafId = null

        function checkFrame(time) {
          const delta = time - lastTime
          lastTime = time
          if (delta > 0) frames.push(1000 / delta)

          if (time - startTime < duration * 1000) {
            rafId = requestAnimationFrame(checkFrame)
          } else {
            if (rafId) cancelAnimationFrame(rafId)
            if (frames.length === 0) { resolve({ error: 'No frames captured', frames: 0 }); return }
            const sorted = [...frames].sort((a, b) => a - b)
            const avg = frames.reduce((a, b) => a + b, 0) / frames.length
            const min = sorted[0]
            const max = sorted[sorted.length - 1]
            const median = sorted[Math.floor(sorted.length / 2)]
            const p95 = sorted[Math.floor(sorted.length * 0.95)]
            const p99 = sorted[Math.floor(sorted.length * 0.99)]
            const stable = frames.filter(f => f >= 55).length / frames.length
            const drops = frames.filter(f => f < 30).length

            resolve({
              duration,
              frames: frames.length,
              avg: Math.round(avg * 10) / 10,
              min: Math.round(min * 10) / 10,
              max: Math.round(max * 10) / 10,
              median: Math.round(median * 10) / 10,
              p95: Math.round(p95 * 10) / 10,
              p99: Math.round(p99 * 10) / 10,
              stability: Math.round(stable * 10000) / 100,
              drops,
              allFrames: frames.slice(0, 1000)
            })
          }
        }

        const startTime = performance.now()
        rafId = requestAnimationFrame(checkFrame)
      })
    }, seconds)
  }

  async measureWithActivity(seconds = 5, activity = 'arrows') {
    const fpsData = await this.measure(seconds)
    return fpsData
  }

  async stressTest(duration = 10) {
    const results = []
    const intervals = [5, 10, 20, 30]
    for (const interval of intervals) {
      await this.page.evaluate((ms) => {
        return new Promise(resolve => setTimeout(resolve, ms))
      }, interval)
    }
    const fps = await this.measure(duration)
    return fps
  }
}
