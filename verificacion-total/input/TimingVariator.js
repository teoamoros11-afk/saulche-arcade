export class TimingVariator {
  constructor(page) {
    this.page = page
  }

  async withDelay(ms) {
    await this.page.waitForTimeout(ms)
  }

  async pressWithVariation(key, baseInterval = 100) {
    const variation = Math.floor((Math.random() - 0.5) * baseInterval * 0.5)
    const actual = Math.max(10, baseInterval + variation)
    await this.page.keyboard.press(key)
    await this.page.waitForTimeout(actual)
    return { key, baseInterval, variation, actual }
  }

  async sequenceWithAcceleration(keys, startInterval = 200, endInterval = 20) {
    const results = []
    for (let i = 0; i < keys.length; i++) {
      const progress = i / (keys.length - 1 || 1)
      const interval = startInterval + (endInterval - startInterval) * progress
      await this.page.keyboard.press(keys[i])
      results.push({ key: keys[i], interval: Math.round(interval) })
      await this.page.waitForTimeout(Math.max(5, interval))
    }
    return results
  }

  async sequenceWithDeceleration(keys, startInterval = 20, endInterval = 200) {
    return this.sequenceWithAcceleration(keys, startInterval, endInterval)
  }

  async rapidBurst(key, burstCount, burstInterval, restMs) {
    const results = []
    for (let b = 0; b < burstCount; b++) {
      const burstStart = Date.now()
      for (let i = 0; i < 5; i++) {
        await this.page.keyboard.press(key)
        results.push({ burst: b, i, time: Date.now() - burstStart })
      }
      await this.page.waitForTimeout(restMs)
    }
    return { bursts: burstCount, totalPresses: results.length }
  }

  async intervalSweep(key, intervals = [500, 300, 200, 100, 50, 30, 16, 8, 4, 2]) {
    const results = []
    for (const interval of intervals) {
      const start = Date.now()
      try {
        await this.page.keyboard.press(key)
        await this.page.waitForTimeout(interval)
        results.push({ interval, ok: true, elapsed: Date.now() - start })
      } catch {
        results.push({ interval, ok: false })
      }
    }
    return { key, intervals: results }
  }

  async variableHold(key, durations = [50, 100, 200, 500, 1000, 2000, 5000]) {
    const results = []
    for (const dur of durations) {
      try {
        await this.page.keyboard.down(key)
        await this.page.waitForTimeout(dur)
        await this.page.keyboard.up(key)
        results.push({ duration: dur, ok: true })
      } catch {
        results.push({ duration: dur, ok: false })
      }
    }
    return { key, holds: results }
  }
}
