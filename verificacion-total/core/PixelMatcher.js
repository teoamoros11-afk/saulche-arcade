export class PixelMatcher {
  constructor({ tolerance = 0, threshold = 0 } = {}) {
    this.tolerance = tolerance   // diff numérica por canal
    this.threshold = threshold   // % de píxeles diferentes permitido
  }

  compare(actualData, expectedData, width, height) {
    const diffs = []
    let diffCount = 0
    const totalPixels = width * height

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const rA = actualData[idx], gA = actualData[idx + 1], bA = actualData[idx + 2], aA = actualData[idx + 3]
        const rE = expectedData[idx], gE = expectedData[idx + 1], bE = expectedData[idx + 2], aE = expectedData[idx + 3]
        const dr = Math.abs(rA - rE), dg = Math.abs(gA - gE), db = Math.abs(bA - bE), da = Math.abs(aA - aE)
        if (dr > this.tolerance || dg > this.tolerance || db > this.tolerance || da > this.tolerance) {
          diffCount++
          diffs.push({
            x, y,
            actual: { r: rA, g: gA, b: bA, a: aA },
            expected: { r: rE, g: gE, b: bE, a: aE },
            delta: { dr, dg, db, da },
            deltaE: Math.sqrt(dr * dr + dg * dg + db * db + da * da)
          })
        }
      }
    }

    const pct = totalPixels > 0 ? (diffCount / totalPixels) * 100 : 0
    return {
      match: diffCount === 0,
      diffCount,
      totalPixels,
      diffPercent: pct,
      acceptable: this.threshold === 0 ? diffCount === 0 : pct <= this.threshold,
      diffs: diffs.slice(0, 1000),
      allDiffs: diffs.length
    }
  }

  async captureCanvas(page, { canvasIndex = 0, format = 'png' } = {}) {
    return page.evaluate(({ idx }) => {
      const canvases = document.querySelectorAll('canvas')
      const c = canvases[idx]
      if (!c) return null
      return c.toDataURL('image/' + format)
    }, { idx: canvasIndex })
  }

  async canvasToImageData(page, { canvasIndex = 0 } = {}) {
    return page.evaluate(({ idx }) => {
      const canvases = document.querySelectorAll('canvas')
      const c = canvases[idx]
      if (!c) return null
      const ctx = c.getContext('2d')
      if (!ctx) return null
      const imgData = ctx.getImageData(0, 0, c.width, c.height)
      return { data: Array.from(imgData.data), width: c.width, height: c.height }
    }, { idx: canvasIndex })
  }

  async canvasStats(page, { canvasIndex = 0 } = {}) {
    return page.evaluate(({ idx }) => {
      const canvases = document.querySelectorAll('canvas')
      const c = canvases[idx]
      if (!c) return null
      const ctx = c.getContext('2d')
      if (!ctx) return { width: c.width, height: c.height, hasContext: false }
      const imgData = ctx.getImageData(0, 0, c.width, c.height)
      let totalR = 0, totalG = 0, totalB = 0, totalA = 0, uniqueColors = new Set(), minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0
      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i], g = imgData.data[i + 1], b = imgData.data[i + 2], a = imgData.data[i + 3]
        totalR += r; totalG += g; totalB += b; totalA += a
        uniqueColors.add(`${r},${g},${b},${a}`)
        if (r < minR) minR = r; if (r > maxR) maxR = r
        if (g < minG) minG = g; if (g > maxG) maxG = g
        if (b < minB) minB = b; if (b > maxB) maxB = b
      }
      const pixelCount = imgData.data.length / 4
      return {
        width: c.width, height: c.height, pixelCount,
        avgColor: { r: Math.round(totalR / pixelCount), g: Math.round(totalG / pixelCount), b: Math.round(totalB / pixelCount), a: Math.round(totalA / pixelCount) },
        colorRange: { r: { min: minR, max: maxR }, g: { min: minG, max: maxG }, b: { min: minB, max: maxB } },
        uniqueColorCount: uniqueColors.size,
        hasAlpha: imgData.data.some((v, i) => i % 4 === 3 && v < 255)
      }
    }, { idx: canvasIndex })
  }

  async detectAnomalies(page, { canvasIndex = 0 } = {}) {
    return page.evaluate(({ idx }) => {
      const c = document.querySelectorAll('canvas')[idx]
      if (!c) return null
      const ctx = c.getContext('2d')
      const imgData = ctx.getImageData(0, 0, c.width, c.height)
      const d = imgData.data
      const anomalies = []
      for (let y = 1; y < c.height - 1; y++) {
        for (let x = 1; x < c.width - 1; x++) {
          const i = (y * c.width + x) * 4
          const isolated = (
            Math.abs(d[i] - d[i - 4]) > 80 && Math.abs(d[i] - d[i + 4]) > 80 &&
            Math.abs(d[i] - d[i - c.width * 4]) > 80 && Math.abs(d[i] - d[i + c.width * 4]) > 80
          )
          if (isolated) {
            anomalies.push({ x, y, color: { r: d[i], g: d[i + 1], b: d[i + 2] } })
            if (anomalies.length >= 50) break
          }
        }
        if (anomalies.length >= 50) break
      }
      return { anomalyCount: anomalies.length, anomalies }
    }, { idx: canvasIndex })
  }

  generateDiffImage(actualData, expectedData, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const output = ctx.createImageData(width, height)
    for (let i = 0; i < width * height * 4; i += 4) {
      const dr = Math.abs(actualData[i] - expectedData[i])
      const dg = Math.abs(actualData[i + 1] - expectedData[i + 1])
      const db = Math.abs(actualData[i + 2] - expectedData[i + 2])
      if (dr > 0 || dg > 0 || db > 0) {
        output.data[i] = 255; output.data[i + 1] = 0; output.data[i + 2] = 0; output.data[i + 3] = 255
      } else {
        output.data[i] = actualData[i]; output.data[i + 1] = actualData[i + 1]; output.data[i + 2] = actualData[i + 2]; output.data[i + 3] = 128
      }
    }
    ctx.putImageData(output, 0, 0)
    return canvas.toDataURL()
  }
}
