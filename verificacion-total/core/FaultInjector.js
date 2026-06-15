export class FaultInjector {
  constructor(page) {
    this.page = page
  }

  async corruptLocalStorage() {
    return this.page.evaluate(() => {
      try {
        const keys = Object.keys(localStorage)
        for (const key of keys) {
          localStorage.setItem(key + '_corrupt', 'undefined')
        }
        return { corrupted: keys.length }
      } catch { return { corrupted: 0 } }
    })
  }

  async fillLocalStorage(maxItems = 5000) {
    return this.page.evaluate((max) => {
      let count = 0
      try {
        for (let i = 0; i < max; i++) {
          localStorage.setItem(`_stress_${i}`, 'x'.repeat(1024))
          count++
        }
      } catch {}
      return { written: count }
    }, maxItems)
  }

  async clearLocalStorage() {
    return this.page.evaluate(() => {
      const keys = Object.keys(localStorage)
      for (const key of keys) localStorage.removeItem(key)
      return { cleared: keys.length }
    })
  }

  async injectInvalidState(variable, value) {
    return this.page.evaluate(({ v, val }) => {
      try {
        const fn = new Function('v', 'val', `window.${v} = val`)
        fn(v, val)
        return { injected: true, variable: v, value: val }
      } catch (e) {
        return { injected: false, error: e.message }
      }
    }, { v: variable, val: value })
  }

  async blockCanvas() {
    return this.page.evaluate(() => {
      const orig = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function () { return null }
      return { blocked: true }
    })
  }

  async restoreCanvas() {
    return this.page.evaluate(() => {
      location.reload()
    })
  }

  async blockAudio() {
    return this.page.evaluate(() => {
      window.AudioContext = function () {
        return { createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {} }), createGain: () => ({ connect: () => {}, gain: { value: 0 } }), destination: {} }
      }
      return { blocked: true }
    })
  }

  async corruptGameLoop() {
    return this.page.evaluate(() => {
      if (typeof requestAnimationFrame !== 'undefined') {
        window._origRAF = window.requestAnimationFrame
        window.requestAnimationFrame = function () { return 0 }
        return true
      }
      if (typeof setInterval !== 'undefined' && typeof gameInterval !== 'undefined') {
        clearInterval(gameInterval)
        return true
      }
      return false
    })
  }

  async restoreGameLoop() {
    return this.page.evaluate(() => {
      if (window._origRAF) {
        window.requestAnimationFrame = window._origRAF
        delete window._origRAF
      }
      return true
    })
  }

  async injectRandomPageEvents(count = 100) {
    const events = ['mousemove', 'mouseover', 'mouseout', 'focus', 'blur', 'scroll', 'wheel']
    const results = []
    for (let i = 0; i < count; i++) {
      const evt = events[Math.floor(Math.random() * events.length)]
      try {
        await this.page.evaluate(({ eventName }) => {
          window.dispatchEvent(new Event(eventName))
        }, { eventName: evt })
        results.push({ event: evt, ok: true })
      } catch { results.push({ event: evt, ok: false }) }
    }
    return results
  }

  async simulateLowMemory() {
    return this.page.evaluate(() => {
      const huge = []
      try {
        for (let i = 0; i < 10000; i++) {
          huge.push(new Array(1000).fill('x'))
        }
      } catch {}
      return { allocated: true }
    })
  }
}
