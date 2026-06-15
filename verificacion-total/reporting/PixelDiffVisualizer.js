import fs from 'fs'
import path from 'path'

export class PixelDiffVisualizer {
  constructor({ outputDir = './reports/diffs' } = {}) {
    this.outputDir = outputDir
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  }

  generateDiffPNG(actualData, expectedData, width, height) {
    const { createCanvas } = (() => {
      try { return require('canvas') } catch { return { createCanvas: null } }
    })()
    if (!createCanvas) return null

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const imageData = ctx.createImageData(width, height)
    for (let i = 0; i < width * height * 4; i += 4) {
      const dr = Math.abs(actualData[i] - expectedData[i])
      const dg = Math.abs(actualData[i + 1] - expectedData[i + 1])
      const db = Math.abs(actualData[i + 2] - expectedData[i + 2])
      if (dr > 0 || dg > 0 || db > 0) {
        imageData.data[i] = 255
        imageData.data[i + 1] = 0
        imageData.data[i + 2] = 0
        imageData.data[i + 3] = 255
      } else {
        imageData.data[i] = expectedData[i]
        imageData.data[i + 1] = expectedData[i + 1]
        imageData.data[i + 2] = expectedData[i + 2]
        imageData.data[i + 3] = 128
      }
    }
    ctx.putImageData(imageData, 0, 0)
    return canvas.toBuffer('image/png')
  }

  generateHeatmapPNG(actualData, expectedData, width, height) {
    const { createCanvas } = (() => {
      try { return { createCanvas: null } }
      catch { return { createCanvas: null } }
    })()
    if (!createCanvas) return null

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(width, height)
    let maxDelta = 0
    const deltas = new Float32Array(width * height)

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      const dr = Math.abs(actualData[idx] - expectedData[idx])
      const dg = Math.abs(actualData[idx + 1] - expectedData[idx + 1])
      const db = Math.abs(actualData[idx + 2] - expectedData[idx + 2])
      const delta = (dr + dg + db) / 3
      deltas[i] = delta
      if (delta > maxDelta) maxDelta = delta
    }

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      const intensity = maxDelta > 0 ? deltas[i] / maxDelta : 0
      imageData.data[idx] = Math.round(intensity * 255)
      imageData.data[idx + 1] = Math.round((1 - intensity) * 255)
      imageData.data[idx + 2] = 0
      imageData.data[idx + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toBuffer('image/png')
  }

  saveDiffImage(actual, expected, width, height, gameId, snapshotName) {
    const dir = path.join(this.outputDir, gameId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const diffPng = this.generateDiffPNG(actual, expected, width, height)
    if (diffPng) {
      const fp = path.join(dir, `${snapshotName}-diff.png`)
      fs.writeFileSync(fp, diffPng)
    }

    const heatPng = this.generateHeatmapPNG(actual, expected, width, height)
    if (heatPng) {
      const fp = path.join(dir, `${snapshotName}-heatmap.png`)
      fs.writeFileSync(fp, heatPng)
    }

    return {
      diffPath: diffPng ? path.join(dir, `${snapshotName}-diff.png`) : null,
      heatmapPath: heatPng ? path.join(dir, `${snapshotName}-heatmap.png`) : null
    }
  }

  computeDiffStats(actualData, expectedData, width, height) {
    let diffPixels = 0
    let totalDelta = 0
    let maxDelta = 0
    const totalPixels = width * height

    for (let i = 0; i < width * height * 4; i += 4) {
      const dr = Math.abs(actualData[i] - expectedData[i])
      const dg = Math.abs(actualData[i + 1] - expectedData[i + 1])
      const db = Math.abs(actualData[i + 2] - expectedData[i + 2])
      const delta = dr + dg + db
      if (delta > 0) {
        diffPixels++
        totalDelta += delta
        if (delta > maxDelta) maxDelta = delta
      }
    }

    return {
      totalPixels,
      diffPixels,
      diffPercent: totalPixels > 0 ? ((diffPixels / totalPixels) * 100).toFixed(2) : 0,
      avgDelta: diffPixels > 0 ? (totalDelta / diffPixels).toFixed(2) : 0,
      maxDelta,
      identical: diffPixels === 0
    }
  }

  generateSideBySideHTML(actualPng, expectedPng, diffPng, stats, gameId, snapshotName) {
    const actualSrc = actualPng ? `data:image/png;base64,${fs.readFileSync(actualPng).toString('base64')}` : ''
    const expectedSrc = expectedPng ? `data:image/png;base64,${fs.readFileSync(expectedPng).toString('base64')}` : ''
    const diffSrc = diffPng ? `data:image/png;base64,${fs.readFileSync(diffPng).toString('base64')}` : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diff: ${gameId}/${snapshotName}</title>
<style>
  body { background:#0f0f1a; color:#e0e0e0; font-family:monospace; padding:2rem; }
  h1 { color:#fff; }
  .stats { background:#1a1a2e; padding:1rem; border-radius:8px; border:1px solid #333; margin:1rem 0; }
  .images { display:flex; gap:1rem; flex-wrap:wrap; }
  .images div { text-align:center; }
  .images img { max-width:100%; border:1px solid #333; border-radius:4px; }
  .label { color:#888; margin-top:0.5rem; }
  .bad { color:#f44336 } .good { color:#4caf50 }
</style>
</head>
<body>
<h1>Pixel Diff: ${gameId} / ${snapshotName}</h1>
<div class="stats">
  <p>Diff Pixels: <strong class="${stats.identical ? 'good' : 'bad'}">${stats.diffPixels}</strong> / ${stats.totalPixels} (${stats.diffPercent}%)</p>
  <p>Avg Delta: <strong>${stats.avgDelta}</strong> | Max Delta: <strong>${stats.maxDelta}</strong></p>
  <p>Status: <strong class="${stats.identical ? 'good' : 'bad'}">${stats.identical ? 'IDENTICAL' : 'DIFFERENT'}</strong></p>
</div>
<div class="images">
  <div><img src="${expectedSrc}" /><div class="label">Expected (Golden)</div></div>
  <div><img src="${actualSrc}" /><div class="label">Actual</div></div>
  <div><img src="${diffSrc}" /><div class="label">Diff (Red = Changed)</div></div>
</div>
</body>
</html>`
  }
}
