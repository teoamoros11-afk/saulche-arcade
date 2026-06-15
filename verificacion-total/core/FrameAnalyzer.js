export class FrameAnalyzer {
  constructor(page) {
    this.page = page
  }

  async analyzeCanvas(canvasIndex = 0) {
    return this.page.evaluate((idx) => {
      const c = document.querySelectorAll('canvas')[idx]
      if (!c) return { error: 'No canvas found' }
      const ctx = c.getContext('2d')
      if (!ctx) return { error: 'No 2d context' }
      const w = c.width, h = c.height
      const imgData = ctx.getImageData(0, 0, w, h)
      const d = imgData.data
      const stats = {
        width: w, height: h, pixelCount: w * h,
        usedPixels: 0, transparentPixels: 0, blackPixels: 0, whitePixels: 0,
        dominantColor: null, colorCount: 0,
        topColors: [], horizontalEdges: 0, verticalEdges: 0,
        leftMargin: h, rightMargin: 0, topMargin: w, bottomMargin: 0
      }
      const colorMap = new Map()
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3]
          if (a < 10) { stats.transparentPixels++; continue }
          if (r === 0 && g === 0 && b === 0 && a === 255) stats.blackPixels++
          if (r === 255 && g === 255 && b === 255 && a === 255) stats.whitePixels++
          stats.usedPixels++
          const key = `${r},${g},${b}`
          colorMap.set(key, (colorMap.get(key) || 0) + 1)
          if (x < stats.leftMargin) stats.leftMargin = x
          if (x > stats.rightMargin) stats.rightMargin = x
          if (y < stats.topMargin) stats.topMargin = y
          if (y > stats.bottomMargin) stats.bottomMargin = y
          if (x > 0) {
            const pi = (y * w + (x - 1)) * 4
            if (Math.abs(r - d[pi]) + Math.abs(g - d[pi + 1]) + Math.abs(b - d[pi + 2]) > 60) stats.horizontalEdges++
          }
          if (y > 0) {
            const pi = ((y - 1) * w + x) * 4
            if (Math.abs(r - d[pi]) + Math.abs(g - d[pi + 1]) + Math.abs(b - d[pi + 2]) > 60) stats.verticalEdges++
          }
        }
      }
      const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1])
      stats.colorCount = colorMap.size
      stats.topColors = sorted.slice(0, 10).map(([color, count]) => ({ color, count, pct: ((count / stats.usedPixels) * 100).toFixed(1) + '%' }))
      if (sorted.length) {
        const [r, g, b] = sorted[0][0].split(',').map(Number)
        stats.dominantColor = { r, g, b, hex: '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''), count: sorted[0][1] }
      }
      stats.contentArea = { x: stats.leftMargin, y: stats.topMargin, width: stats.rightMargin - stats.leftMargin + 1, height: stats.bottomMargin - stats.topMargin + 1 }
      stats.contentRatio = stats.usedPixels > 0 ? ((stats.contentArea.width * stats.contentArea.height) / stats.pixelCount * 100).toFixed(1) + '%' : '0%'
      return stats
    }, canvasIndex)
  }

  async measureDrawCalls(frameCount = 60) {
    const before = await this.page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return null
      const ctx = c.getContext('2d')
      if (!ctx) return null
      const methods = ['fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage', 'beginPath', 'fill', 'stroke', 'arc', 'rect', 'lineTo', 'moveTo', 'bezierCurveTo', 'quadraticCurveTo']
      const counts = {}
      for (const m of methods) {
        counts[m] = 0
        const orig = ctx[m].bind(ctx)
        ctx[m] = function (...args) {
          counts[m]++
          return orig(...args)
        }
      }
      return counts
    })

    if (!before) return null

    await this.page.waitForTimeout((frameCount / 60) * 1000)

    const after = await this.page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return null
      const ctx = c.getContext('2d')
      if (!ctx) return null
      const methods = ['fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage', 'beginPath', 'fill', 'stroke', 'arc', 'rect', 'lineTo', 'moveTo', 'bezierCurveTo', 'quadraticCurveTo']
      const counts = {}
      for (const m of methods) {
        counts[m] = 0
      }
      return counts
    })

    return { before, after, frameCount }
  }

  async checkEmptyFrame(canvasIndex = 0) {
    return this.page.evaluate((idx) => {
      const c = document.querySelectorAll('canvas')[idx]
      if (!c) return { error: 'No canvas' }
      const ctx = c.getContext('2d')
      const d = ctx.getImageData(0, 0, c.width, c.height).data
      const first = d[0]
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] !== first || d[i + 1] !== d[1] || d[i + 2] !== d[2]) return { empty: false, firstDifferent: i / 4 }
      }
      return { empty: true, color: { r: d[0], g: d[1], b: d[2], a: d[3] } }
    }, canvasIndex)
  }

  async samplePixels(canvasIndex = 0, count = 100) {
    return this.page.evaluate(({ idx, n }) => {
      const c = document.querySelectorAll('canvas')[idx]
      if (!c) return []
      const ctx = c.getContext('2d')
      const w = c.width, h = c.height
      const samples = []
      for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * w)
        const y = Math.floor(Math.random() * h)
        const p = ctx.getImageData(x, y, 1, 1).data
        samples.push({ x, y, r: p[0], g: p[1], b: p[2], a: p[3], hex: '#' + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, '0')).join('') })
      }
      return samples
    }, { idx: canvasIndex, count })
  }

  async checkTextRendering(canvasIndex = 0) {
    return this.page.evaluate((idx) => {
      const c = document.querySelectorAll('canvas')[idx]
      if (!c) return null
      const ctx = c.getContext('2d')
      const props = ['font', 'fillStyle', 'strokeStyle', 'textAlign', 'textBaseline', 'direction']
      const state = {}
      for (const p of props) state[p] = ctx[p]
      return state
    }, canvasIndex)
  }
}
