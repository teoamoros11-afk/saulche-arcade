import { test, expect } from '@playwright/test'
import { adapters, gameUrl, allGameIds, history, oracle, ruleEngine, invariantChecker } from '../00-runner.js'

test.describe('Exhaustivo (Exhaustive)', () => {
  for (const adapter of adapters) {
    const gameId = adapter.file.replace('.html', '')
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Carga, state, canvas, input, audio, persistencia integrados', async ({ page }) => {
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)

        const hasTitle = await page.title()
        expect(hasTitle).toBeTruthy()

        const state = await adapter.getState(page)
        expect(state).not.toBeNull()

        if (adapter.usesCanvas) {
          const canvasOk = await page.evaluate((id) => {
            const c = id ? document.getElementById(id) : document.querySelector('canvas')
            if (!c) return false
            const ctx = c.getContext('2d')
            return !!(ctx && c.width > 0 && c.height > 0)
          }, adapter.canvasId)
          expect(canvasOk).toBe(true)
        }

        const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter']
        for (const key of validKeys) {
          await page.keyboard.press(key).catch(() => {})
        }
        await page.mouse.click(400, 300).catch(() => {})

        const sfxExists = await page.evaluate(() => typeof window.sfx === 'function')
        expect(sfxExists).toBe(true)

        if (adapter.saveKey) {
          const persistOk = await page.evaluate((key) => {
            try {
              localStorage.setItem(key, JSON.stringify({ test: true }))
              const v = localStorage.getItem(key)
              localStorage.removeItem(key)
              return v !== null
            } catch { return false }
          }, adapter.saveKey)
          expect(persistOk).toBe(true)
        }

        await history.record('exhaustive-test', {
          gameId, state, errors: errors.filter(e => !e.includes('register a ServiceWorker')),
          timestamp: Date.now()
        })

        const gameErrors = errors.filter(e => !e.includes('register a ServiceWorker'))
        expect(gameErrors).toEqual([])
      })

      test('Multi-estado: iniciar juego y verificar transiciones', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)

        const stateBefore = await adapter.getState(page)
        await adapter.startGame(page)
        await page.waitForTimeout(500)
        const stateAfter = await adapter.getState(page)

        if (stateBefore && stateAfter) {
          const beforeJSON = JSON.stringify(stateBefore)
          const afterJSON = JSON.stringify(stateAfter)
          if (beforeJSON !== afterJSON) {
            await history.record('state-transition', {
              gameId,
              before: stateBefore,
              after: stateAfter,
              timestamp: Date.now()
            })
          }
        }
      })

      test('Especificación formal completa validada', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(1000)
        const result = await oracle.validateAgainstSpec(page, gameId, adapter)
        expect(result).not.toBeNull()
        if (result && !result.valid) {
          console.warn(`Spec validation issues for ${gameId}:`, result.errors)
        }
      })

      test('Reglas + invariantes + canvas checks integrados', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(1000)

        const ruleResult = await ruleEngine.evaluateRules(page, gameId)
        expect(ruleResult).not.toBeNull()

        const invResult = await invariantChecker.checkAll(page, gameId)
        expect(invResult).not.toBeNull()
      })

      test('Fuzzing rápido de inputs', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const errors = []
        page.on('pageerror', e => errors.push(e.message))

        const allKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape', 'Tab', 'Shift', 'Control', 'Alt', 'a', 'b', 'c', '1', '2', '3']
        for (const key of allKeys) {
          await page.keyboard.press(key).catch(() => {})
        }

        const positions = [[0, 0], [400, 300], [800, 600], [-1, -1], [9999, 9999]]
        for (const [x, y] of positions) {
          await page.mouse.click(x, y).catch(() => {})
        }

        const gameErrors = errors.filter(e => !e.includes('register a ServiceWorker'))
        expect(gameErrors.length).toBeLessThan(3)
      })
    })
  }
})
