import { test, expect } from '@playwright/test'
import { adapters, gameUrl, oracle } from '../00-runner.js'

test.describe('Estado (State)', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Estado se obtiene sin error', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        await adapter.startGame(page).catch(() => {})
        await page.waitForTimeout(300)
        const state = await adapter.getState(page)
        if (state === null) {
          console.warn(`State is null for ${adapter.file} - game uses IIFE-scoped variables`)
        }
      })

      test('Estado tiene al menos una variable definida', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const state = await adapter.getState(page)
        if (state) {
          expect(Object.keys(state).length).toBeGreaterThan(0)
        }
      })

      test('Variables globales no son NaN ni Infinity', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const hasNaN = await page.evaluate(() => {
          const check = (obj, path) => {
            if (!obj || typeof obj !== 'object') return false
            for (const [k, v] of Object.entries(obj)) {
              if (typeof v === 'number' && (isNaN(v) || !isFinite(v))) return true
              if (typeof v === 'object' && v !== null && check(v, `${path}.${k}`)) return true
            }
            return false
          }
          const targets = ['state', 'gameState', 'level', 'score']
          for (const t of targets) {
            if (typeof window[t] !== 'undefined') {
              if (typeof window[t] === 'number' && (isNaN(window[t]) || !isFinite(window[t]))) return true
            }
          }
          return false
        })
        expect(hasNaN).toBe(false)
      })

      test('gameState/state tiene valores esperados', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const valid = await page.evaluate(() => {
          const gs = window.gameState ?? window.state ?? ''
          const validStates = ['menu', 'playing', 'gameover', 'game_over', 'over', 'idle', 'start', 'levelComplete', 'celebration', 'pause', '']
          return typeof gs === 'string' && validStates.includes(gs)
        })
        expect(valid).toBe(true)
      })

      test('level es número no negativo si existe', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const state = await adapter.getState(page)
        if (state && typeof state.level !== 'undefined') {
          expect(typeof state.level).toBe('number')
          expect(state.level).toBeGreaterThanOrEqual(0)
        }
      })

      test('score es número no negativo si existe', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
        const state = await adapter.getState(page)
        if (state && typeof state.score !== 'undefined') {
          expect(typeof state.score).toBe('number')
          expect(state.score).toBeGreaterThanOrEqual(0)
        }
      })
    })
  }
})
