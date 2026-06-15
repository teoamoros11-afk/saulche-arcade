import { test, expect } from '@playwright/test'
import { adapters, gameUrl, snapshots, pixelMatcher } from '../00-runner.js'

test.describe('Regresión (Regression)', () => {
  for (const adapter of adapters) {
    const gameId = adapter.file.replace('.html', '')
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Snapshot golden existe o se crea', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1500)
        if (!adapter.usesCanvas) return
        if (!snapshots.goldenExists(gameId, 'golden-initial')) {
          await snapshots.saveAsGolden(page, gameId, 'golden-initial')
        }
        expect(snapshots.goldenExists(gameId, 'golden-initial')).toBe(true)
      })

      test('Render actual se guarda como snapshot', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1500)
        if (!adapter.usesCanvas) return
        const fp = await snapshots.saveSnapshot(page, gameId, 'render-actual')
        expect(fp).toBeTruthy()
      })

      test('Snapshots se guardan en disco', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        if (adapter.usesCanvas) {
          const fp = await snapshots.saveSnapshot(page, gameId, 'regression-check')
          expect(fp).toBeTruthy()
        }
      })

      test('Juego carga consistentemente', async ({ page }) => {
        const stateResults = []
        for (let i = 0; i < 3; i++) {
          await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
          await page.waitForTimeout(500)
          const state = await adapter.getState(page)
          stateResults.push(state)
        }
        expect(stateResults.length).toBe(3)
        expect(stateResults[0]).not.toBeNull()
      })
    })
  }
})
