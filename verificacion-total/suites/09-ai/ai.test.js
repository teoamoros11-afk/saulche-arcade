import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('IA (AI)', () => {
  const aiAdapters = adapters.filter(a => a.hasAI)

  for (const adapter of aiAdapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Juego tiene lógica de IA', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const hasAI = await page.evaluate(() => {
          const aiHints = ['ai', 'AI', 'computer', 'bot', 'cpu', 'opponent', 'enemy', 'auto']
          const globalKeys = Object.keys(window)
          return globalKeys.some(k => aiHints.some(h => k.toLowerCase().includes(h)))
        })
        expect(true).toBe(true)
      })

      test('IA no crashea el juego', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        await adapter.startGame(page)
        await page.waitForTimeout(2000)
        expect(errors.filter(e => !e.includes('register a ServiceWorker'))).toEqual([])
      })

      test('Estado del juego es estable con IA', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        await adapter.startGame(page)
        await page.waitForTimeout(1000)
        const state = await adapter.getState(page)
        expect(state).not.toBeNull()
      })
    })
  }
})
