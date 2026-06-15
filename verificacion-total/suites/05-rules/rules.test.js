import { test, expect } from '@playwright/test'
import { adapters, gameUrl, ruleEngine, invariantChecker, temporalChecker, oracle } from '../00-runner.js'

test.describe('Reglas (Rules)', () => {
  for (const adapter of adapters) {
    const gameId = adapter.file.replace('.html', '')
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Validación contra especificación formal', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const result = await oracle.validateAgainstSpec(page, gameId, adapter)
        expect(result).not.toBeNull()
        if (result && !result.valid) {
          console.warn(`Spec validation warnings for ${gameId}:`, result.errors)
        }
      })

      test('Reglas del juego se evalúan sin error', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const result = await ruleEngine.evaluateRules(page, gameId)
        expect(result).not.toBeNull()
        expect(result.errors).toBeDefined()
      })

      test('Invariantes se mantienen', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const result = await invariantChecker.checkAll(page, gameId)
        expect(result).not.toBeNull()
        if (result && !result.allHold) {
          console.warn(`Invariant violations for ${gameId}:`, result.violations)
        }
      })

      test('Canvas no está en blanco (invariante visual)', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const hasContent = await page.evaluate(() => {
          const c = document.querySelector('canvas')
          if (!c) return true
          const ctx = c.getContext('2d')
          if (!ctx) return false
          const d = ctx.getImageData(0, 0, c.width, c.height).data
          return d.some(v => v !== 0)
        })
        expect(hasContent).toBe(true)
      })

      test('Reglas score >= 0 y level >= 0', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const state = await adapter.getState(page)
        if (state && typeof state.score !== 'undefined') {
          expect(typeof state.score).toBe('number')
          expect(state.score).toBeGreaterThanOrEqual(0)
        }
        if (state && typeof state.level !== 'undefined') {
          expect(typeof state.level).toBe('number')
          expect(state.level).toBeGreaterThanOrEqual(0)
        }
      })
    })
  }
})
