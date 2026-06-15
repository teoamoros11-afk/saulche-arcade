import { test, expect } from '@playwright/test'
import { adapters } from '../adapters/index.js'
import { gameUrl } from '../setup.js'

for (const a of adapters) {
  test(`${a.title} - HTML carga sin errores de consola`, async ({ page }) => {
    const errors = []
    page.on('pageerror', err => { if (!err.message.includes('register a ServiceWorker')) errors.push(err.message) })
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('register a ServiceWorker')) errors.push(msg.text()) })

    await page.goto(gameUrl(a.file), { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    expect(errors, `Errores en ${a.file}: ${errors.join('; ')}`).toEqual([])
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title).toContain(a.title.replace(/ \(.*\)$/, '').split(' ').slice(0, 3).join(' ') || a.title.slice(0, 20))
  })
}
