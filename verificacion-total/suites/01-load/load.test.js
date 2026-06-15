import { test, expect } from '@playwright/test'
import { adapters, gameUrl, allGameIds, setupGame } from '../00-runner.js'

test.describe('Carga (Load)', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Carga sin errores de red', async ({ page }) => {
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(1000)
        expect(errors.filter(e => !e.includes('register a ServiceWorker'))).toEqual([])
      })

      test('Título de página presente', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)
        const title = await page.title()
        expect(title).toBeTruthy()
      })

      test('Body tiene contenido', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)
        const hasContent = await page.evaluate(() => {
          const b = document.body
          return b && (b.children.length > 0 || b.textContent.trim().length > 0)
        })
        expect(hasContent).toBe(true)
      })

      test('No hay errores JS en consola', async ({ page }) => {
        const jsErrors = []
        page.on('pageerror', e => jsErrors.push(e.message))
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)
        expect(jsErrors.filter(e => !e.includes('register a ServiceWorker'))).toEqual([])
      })
    })
  }
})
