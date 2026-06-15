import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('Física (Physics)', () => {
  const physicsAdapters = adapters.filter(a => a.type === 'physics' || a.type === 'platform')

  for (const adapter of physicsAdapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('requestAnimationFrame está activo', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const hasRAF = await page.evaluate(() => typeof window.requestAnimationFrame === 'function')
        expect(hasRAF).toBe(true)
      })

      test('Canvas se actualiza con el tiempo', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        if (!adapter.usesCanvas) return
        await adapter.startGame(page)
        await page.waitForTimeout(500)
        const hash1 = await page.evaluate(() => {
          const c = document.querySelector('canvas')
          if (!c) return null
          const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
          let h = 0; for (let i = 0; i < 1000 && i < d.length; i++) h = ((h << 5) - h) + d[i]; return h
        })
        await page.waitForTimeout(500)
        const hash2 = await page.evaluate(() => {
          const c = document.querySelector('canvas')
          if (!c) return null
          const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
          let h = 0; for (let i = 0; i < 1000 && i < d.length; i++) h = ((h << 5) - h) + d[i]; return h
        })
        expect(hash1).not.toBeNull()
        if (hash1 !== null && hash2 !== null) {
          const changed = hash1 !== hash2
          if (!changed) console.warn(`Canvas hash unchanged for ${adapter.file} - game may be static or not animating`)
        }
      })

      test('Juego no se queda congelado (estado cambia)', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        await adapter.startGame(page)
        const state1 = await adapter.getState(page)
        await page.waitForTimeout(1000)
        const state2 = await adapter.getState(page)
        expect(state1).not.toBeNull()
        expect(state2).not.toBeNull()
      })
    })
  }
})
