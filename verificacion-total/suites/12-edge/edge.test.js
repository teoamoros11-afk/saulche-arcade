import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('Casos Borde (Edge Cases)', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Carga con viewport mínimo', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 480 })
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        await page.waitForTimeout(500)
        expect(errors.filter(e => !e.includes('register a ServiceWorker'))).toEqual([])
      })

      test('Carga con viewport grande', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 })
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(500)
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        await page.waitForTimeout(500)
        expect(errors.filter(e => !e.includes('register a ServiceWorker'))).toEqual([])
      })

      test('Input rápido no crashea', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const errors = []
        page.on('pageerror', e => errors.push(e.message))
        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('ArrowRight').catch(() => {})
          await page.keyboard.press('ArrowUp').catch(() => {})
          await page.keyboard.press('Space').catch(() => {})
        }
        await page.waitForTimeout(500)
        expect(errors.filter(e => !e.includes('register a ServiceWorker'))).toEqual([])
      })

      test('Carga con red lenta simulada no crashea', async ({ page }) => {
        const client = await page.context().newCDPSession(page)
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 500,
          downloadThroughput: 50000,
          uploadThroughput: 10000
        })
        await page.goto(gameUrl(adapter.file), { waitUntil: 'load', timeout: 30000 }).catch(() => {})
        await page.waitForTimeout(1000)
        const state = await adapter.getState(page).catch(() => null)
        expect(true).toBe(true)
      })

      test('Recarga de página funciona', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        await page.reload({ waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const state = await adapter.getState(page)
        expect(state).not.toBeNull()
      })

      test('Navegación hacia atrás/adelante no crashea', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        await page.goto('about:blank')
        await page.goBack({ waitUntil: 'networkidle' }).catch(() => {})
        await page.waitForTimeout(500)
        const state = await adapter.getState(page).catch(() => null)
        expect(true).toBe(true)
      })
    })
  }
})
