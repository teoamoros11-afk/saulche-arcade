import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('Audio', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Funciones de audio existen', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const hasSfx = await page.evaluate(() => typeof window.sfx === 'function')
        expect(hasSfx).toBe(true)
      })

      test('AudioContext está disponible', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const audioOk = await page.evaluate(() => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            if (ctx.state === 'suspended') ctx.resume()
            ctx.close()
            return true
          } catch { return false }
        })
        expect(audioOk).toBe(true)
      })
    })
  }
})
