export class ErrorBoundaryDetector {
  constructor(page) {
    this.page = page
  }

  async detectUnhandledRejections() {
    return this.page.evaluate(() => {
      return new Promise((resolve) => {
        const rejections = []
        const handler = (event) => {
          rejections.push({ reason: event.reason?.toString() || 'Unknown', promise: !!event.promise })
        }
        window.addEventListener('unhandledrejection', handler)
        setTimeout(() => {
          window.removeEventListener('unhandledrejection', handler)
          resolve({ unhandledRejections: rejections, count: rejections.length })
        }, 2000)
      })
    })
  }

  async forceUnhandledRejection() {
    return this.page.evaluate(() => {
      new Promise((resolve, reject) => {
        reject(new Error('TEST_UNHANDLED_REJECTION'))
      })
    })
  }

  async checkGlobalErrorHandler() {
    return this.page.evaluate(() => {
      const hasWindowOnError = typeof window.onerror !== 'undefined'
      const errorListeners = []
      try {
        const proto = EventTarget.prototype
        const origAdd = proto.addEventListener
        let count = 0
        return { hasOnError: hasWindowOnError, note: 'Cannot enumerate listeners, but onerror exists' }
      } catch {
        return { hasOnError: hasWindowOnError, error: 'Could not check listeners' }
      }
    })
  }

  async throwInContext() {
    return this.page.evaluate(() => {
      try {
        throw new Error('TEST_ERROR_THROWN_BY_VERIFIER')
      } catch (e) {
        return { caught: true, message: e.message, stack: e.stack?.split('\n').slice(0, 5).join('\n') || '(no stack)' }
      }
    })
  }

  async testCanvasErrorResilience() {
    return this.page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return { error: 'No canvas', resilient: true }
      const ctx = c.getContext('2d')
      if (!ctx) return { error: 'No context', resilient: true }
      const results = []
      try { ctx.fillRect(-100, -100, 99999, 99999); results.push({ op: 'fillRect huge', ok: true }) } catch (e) { results.push({ op: 'fillRect huge', ok: false, error: e.message }) }
      try { ctx.drawImage(c, -100, -100); results.push({ op: 'drawImage negative', ok: true }) } catch (e) { results.push({ op: 'drawImage negative', ok: false, error: e.message }) }
      try { ctx.scale(0, 0); ctx.fillRect(0, 0, 10, 10); ctx.setTransform(1, 0, 0, 1, 0, 0); results.push({ op: 'scale zero', ok: true }) } catch (e) { results.push({ op: 'scale zero', ok: false, error: e.message }) }
      try { ctx.rotate(1e10); ctx.setTransform(1, 0, 0, 1, 0, 0); results.push({ op: 'rotate huge', ok: true }) } catch (e) { results.push({ op: 'rotate huge', ok: false, error: e.message }) }
      try { ctx.fillText('', 0, 0); results.push({ op: 'empty text', ok: true }) } catch (e) { results.push({ op: 'empty text', ok: false, error: e.message }) }
      try { ctx.getImageData(0, 0, 0, 0); results.push({ op: 'zero size getImageData', ok: false, expected: true }) } catch (e) { results.push({ op: 'zero size getImageData', ok: true, expected: true, error: e.message }) }
      return { results, allResilient: results.filter(r => !r.ok).length === 0 }
    })
  }
}
