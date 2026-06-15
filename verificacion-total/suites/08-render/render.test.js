import { test, expect } from '@playwright/test'
import { adapters, gameUrl, pixelMatcher, snapshots } from '../00-runner.js'

test.describe('Render', () => {
  for (const adapter of adapters.filter(a => a.usesCanvas)) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Render inicial tiene contenido visible', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const stats = await pixelMatcher.canvasStats(page)
        expect(stats).not.toBeNull()
        if (stats) {
          expect(stats.uniqueColorCount).toBeGreaterThan(1)
        }
      })

      test('Snapshot inicial se guarda correctamente', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1500)
        const gameId = adapter.file.replace('.html', '')
        const fp = await snapshots.saveSnapshot(page, gameId, 'render-initial')
        expect(fp).toBeTruthy()
      })

      test('Canvas cambia tras interacción', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const before = await pixelMatcher.canvasToImageData(page)
        await page.keyboard.press('ArrowRight').catch(() => {})
        await page.mouse.click(400, 300).catch(() => {})
        await page.waitForTimeout(300)
        const after = await pixelMatcher.canvasToImageData(page)
        if (before && after) {
          const result = pixelMatcher.compare(
            new Uint8ClampedArray(after.data),
            new Uint8ClampedArray(before.data),
            before.width, before.height
          )
          if (result.totalPixels > 0) {
            expect(result.match).toBe(false)
          }
        }
      })

      test('Render no tiene artefactos visuales obvios', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const anomalies = await pixelMatcher.detectAnomalies(page)
        if (anomalies) {
          expect(anomalies.anomalyCount).toBeLessThan(50)
        }
      })

      test('Colores del canvas están en rango esperado', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const stats = await pixelMatcher.canvasStats(page)
        if (stats) {
          expect(stats.colorRange.r.min).toBeGreaterThanOrEqual(0)
          expect(stats.colorRange.r.max).toBeLessThanOrEqual(255)
          expect(stats.colorRange.g.min).toBeGreaterThanOrEqual(0)
          expect(stats.colorRange.g.max).toBeLessThanOrEqual(255)
          expect(stats.colorRange.b.min).toBeGreaterThanOrEqual(0)
          expect(stats.colorRange.b.max).toBeLessThanOrEqual(255)
        }
      })
    })
  }
})
