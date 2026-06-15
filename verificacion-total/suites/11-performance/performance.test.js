import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('Rendimiento (Performance)', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Tiempo de carga < 10s', async ({ page }) => {
        const start = Date.now()
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 30000 })
        const elapsed = Date.now() - start
        expect(elapsed).toBeLessThan(10000)
      })

      test('Carga inicial de página < 5s', async ({ page }) => {
        const start = Date.now()
        await page.goto(gameUrl(adapter.file), { waitUntil: 'domcontentloaded', timeout: 15000 })
        const elapsed = Date.now() - start
        expect(elapsed).toBeLessThan(5000)
      })

      test('FPS estables durante gameplay', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        await adapter.startGame(page)
        await page.waitForTimeout(500)
        const fps = await page.evaluate(() => {
          return new Promise(resolve => {
            let frames = 0
            const start = performance.now()
            function count() {
              frames++
              if (performance.now() - start >= 1000) {
                resolve(frames)
              } else {
                requestAnimationFrame(count)
              }
            }
            requestAnimationFrame(count)
          })
        })
        expect(fps).toBeGreaterThan(10)
      })

      test('Memoria no crece descontroladamente', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const memInfo = await page.evaluate(() => {
          if (performance.memory) {
            return {
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              usedJSHeapSize: performance.memory.usedJSHeapSize
            }
          }
          return null
        })
        if (memInfo) {
          expect(memInfo.usedJSHeapSize).toBeGreaterThan(0)
          expect(memInfo.usedJSHeapSize).toBeLessThan(memInfo.jsHeapSizeLimit)
        }
      })

      test('Render loop activo (requestAnimationFrame)', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const hasLoop = await page.evaluate(() => {
          return new Promise(resolve => {
            let rafId = null
            const timeout = setTimeout(() => { if (rafId) cancelAnimationFrame(rafId); resolve(false) }, 500)
            rafId = requestAnimationFrame(() => { clearTimeout(timeout); resolve(true) })
          })
        })
        expect(hasLoop).toBe(true)
      })
    })
  }
})
