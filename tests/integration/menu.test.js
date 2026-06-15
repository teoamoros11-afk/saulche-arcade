import { test, expect } from '@playwright/test'
import { adapters } from '../adapters/index.js'
import { gameUrl } from '../setup.js'

test('Menú principal carga todos los juegos', async ({ page }) => {
    const errors = []
  page.on('pageerror', err => { if (!err.message.includes('register a ServiceWorker')) errors.push(err.message) })
  await page.goto(gameUrl('index.html'), { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1000)
  expect(errors).toEqual([])

  const title = await page.title()
  expect(title).toContain('Grizzy')

  const gameLinks = await page.locator('.game-btn').count()
  expect(gameLinks).toBe(adapters.length)
})

test('Cada juego tiene enlace en el menú principal', async ({ page }) => {
  await page.goto(gameUrl('index.html'), { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(500)

  for (const a of adapters) {
    const link = page.locator(`a[href="${a.file}"]`)
    await expect(link).toBeVisible()
  }
})
