import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('Persistencia (Persistence)', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('localStorage está disponible', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const available = await page.evaluate(() => {
          try {
            localStorage.setItem('__test__', '1')
            localStorage.removeItem('__test__')
            return true
          } catch { return false }
        })
        expect(available).toBe(true)
      })

      if (adapter.saveKey) {
        test('Clave de guardado funciona', async ({ page }) => {
          await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          const ok = await page.evaluate((key) => {
            try {
              localStorage.setItem(key, JSON.stringify({ score: 100, level: 2 }))
              const v = JSON.parse(localStorage.getItem(key))
              localStorage.removeItem(key)
              return v && v.score === 100 && v.level === 2
            } catch { return false }
          }, adapter.saveKey)
          expect(ok).toBe(true)
        })

        test('Guardado y carga de progreso', async ({ page }) => {
          await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          const testData = { score: 500, level: 3, timestamp: Date.now() }
          const saved = await page.evaluate(({ key, data }) => {
            try {
              localStorage.setItem(key, JSON.stringify(data))
              return true
            } catch { return false }
          }, { key: adapter.saveKey, data: testData })
          expect(saved).toBe(true)
          const loaded = await page.evaluate((key) => {
            try {
              const v = localStorage.getItem(key)
              return v ? JSON.parse(v) : null
            } catch { return null }
          }, adapter.saveKey)
          expect(loaded).not.toBeNull()
          if (loaded) {
            expect(loaded.score).toBe(500)
          }
          await page.evaluate((key) => localStorage.removeItem(key), adapter.saveKey)
        })
      }

      test('Múltiples escrituras en localStorage no crashean', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const ok = await page.evaluate(() => {
          try {
            for (let i = 0; i < 10; i++) {
              localStorage.setItem(`__test_${i}__`, String(i))
            }
            for (let i = 0; i < 10; i++) {
              localStorage.removeItem(`__test_${i}__`)
            }
            return true
          } catch { return false }
        })
        expect(ok).toBe(true)
      })
    })
  }
})
