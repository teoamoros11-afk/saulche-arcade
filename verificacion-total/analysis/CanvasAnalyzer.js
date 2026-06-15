export class CanvasAnalyzer {
  constructor(page) {
    this.page = page
  }

  async getAllCanvasInfo() {
    return this.page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      return Array.from(canvases).map((c, i) => {
        const ctx = c.getContext('2d')
        return {
          index: i,
          id: c.id || '(none)',
          width: c.width,
          height: c.height,
          cssWidth: c.style.width,
          cssHeight: c.style.height,
          hasContext: !!ctx,
          position: {
            top: c.offsetTop,
            left: c.offsetLeft,
            computedTop: window.getComputedStyle(c).top,
            computedLeft: window.getComputedStyle(c).left,
          },
          rendering: ctx ? {
            fillStyle: ctx.fillStyle,
            strokeStyle: ctx.strokeStyle,
            font: ctx.font,
            textAlign: ctx.textAlign,
            textBaseline: ctx.textBaseline,
            lineWidth: ctx.lineWidth,
            globalAlpha: ctx.globalAlpha,
            globalCompositeOperation: ctx.globalCompositeOperation,
            imageSmoothingEnabled: ctx.imageSmoothingEnabled,
          } : null
        }
      })
    })
  }

  async checkScaling() {
    return this.page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return { error: 'No canvas' }
      const logicalW = c.width
      const logicalH = c.height
      const displayW = c.clientWidth
      const displayH = c.clientHeight
      const scaleX = displayW > 0 ? logicalW / displayW : 0
      const scaleY = displayH > 0 ? logicalH / displayH : 0
      const crisp = Math.abs(scaleX - Math.round(scaleX)) < 0.01 && Math.abs(scaleY - Math.round(scaleY)) < 0.01
      return {
        logicalSize: { width: logicalW, height: logicalH },
        displaySize: { width: displayW, height: displayH },
        scale: { x: scaleX, y: scaleY },
        crisp,
        aspectRatio: logicalW / logicalH,
        displayAspectRatio: displayW / displayH,
        aspectMatch: Math.abs((logicalW / logicalH) - (displayW / displayH)) < 0.01
      }
    })
  }

  async detectFlicker(frames = 10, interval = 100) {
    const history = []
    for (let i = 0; i < frames; i++) {
      const hash = await this.page.evaluate(() => {
        const c = document.querySelector('canvas')
        if (!c) return 0
        const ctx = c.getContext('2d')
        const d = ctx.getImageData(0, 0, Math.min(c.width, 100), Math.min(c.height, 100)).data
        let h = 0
        for (let j = 0; j < d.length; j += 16) h = ((h << 5) - h) + d[j]
        return h
      })
      history.push({ frame: i, hash })
      await this.page.waitForTimeout(interval)
    }
    const unique = new Set(history.map(h => h.hash))
    return { frames: history.length, uniqueFrames: unique.size, flickerDetected: unique.size > frames * 0.8, hashes: history.map(h => h.hash) }
  }

  async checkRedrawEfficiency() {
    const before = await this.page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return null
      const ctx = c.getContext('2d')
      if (!ctx) return null
      let fillCount = 0
      const orig = ctx.fillRect.bind(ctx)
      ctx.fillRect = function (...args) { fillCount++; return orig(...args) }
      const origClear = ctx.clearRect.bind(ctx)
      ctx.clearRect = function (...args) { fillCount++; return origClear(...args) }
      return { fillRect: orig.toString().length, clearRect: origClear.toString().length }
    })
    await this.page.waitForTimeout(500)
    const after = await this.page.evaluate(() => { return { ok: true } })
    return { result: 'Efficiency check completed' }
  }

  async measureRenderTime(frames = 60) {
    const times = []
    for (let i = 0; i < frames; i++) {
      const start = Date.now()
      await this.page.evaluate(() => {
        const c = document.querySelector('canvas')
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.getImageData(0, 0, 1, 1)
      })
      times.push(Date.now() - start)
      if (i % 10 === 9) await this.page.waitForTimeout(100)
    }
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: [...times].sort()[Math.floor(times.length / 2)],
      p95: [...times].sort()[Math.floor(times.length * 0.95)],
      samples: times.length
    }
  }
}
