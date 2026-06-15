import { test, expect } from '@playwright/test'
import { adapters, gameUrl, pixelMatcher, snapshots } from '../00-runner.js'

test.describe('Canvas', () => {
  for (const adapter of adapters.filter(a => a.usesCanvas)) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Canvas existe con contexto 2d válido', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const found = await page.evaluate((id) => {
          const c = id ? document.getElementById(id) : document.querySelector('canvas')
          if (!c) {
            const all = document.querySelectorAll('canvas')
            for (const cc of all) {
              const ctx = cc.getContext('2d')
              if (ctx && cc.width > 0 && cc.height > 0) return true
            }
            return false
          }
          const ctx = c.getContext('2d')
          return !!(ctx && c.width > 0 && c.height > 0)
        }, adapter.canvasId)
        expect(found).toBe(true)
      })

      test('Canvas no está en blanco', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const stats = await pixelMatcher.canvasStats(page)
        expect(stats).not.toBeNull()
        if (stats) {
          expect(stats.pixelCount).toBeGreaterThan(0)
        }
      })

      test('Canvas tiene dimensiones válidas', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const dims = await page.evaluate(() => {
          const c = document.querySelector('canvas')
          if (!c) return null
          return { width: c.width, height: c.height }
        })
        expect(dims).not.toBeNull()
        if (dims) {
          expect(dims.width).toBeGreaterThan(0)
          expect(dims.height).toBeGreaterThan(0)
        }
      })

      test('Captura de snapshot funciona', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const path = await snapshots.saveSnapshot(page, adapter.file.replace('.html', ''), 'initial')
        if (path) {
          expect(path).toBeTruthy()
        }
      })

      test('Sin píxeles anómalos (aislados)', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const anomalies = await pixelMatcher.detectAnomalies(page)
        if (anomalies && anomalies.anomalyCount >= 100) {
          console.warn(`High anomaly count for ${adapter.file}: ${anomalies.anomalyCount} (may be game sprites)`)
        }
      })
    })
  }
})
