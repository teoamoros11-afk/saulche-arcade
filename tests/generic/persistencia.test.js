import { test, expect } from '@playwright/test'
import { adapters } from '../adapters/index.js'
import { gameUrl } from '../setup.js'

for (const a of adapters) {
  if (!a.saveKey) continue

  test(`${a.title} - localStorage guarda correctamente`, async ({ page }) => {
    await page.goto(gameUrl(a.file), { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(500)

    const ok = await page.evaluate((key) => {
      try {
        localStorage.setItem(key, '42')
        const v = localStorage.getItem(key)
        localStorage.removeItem(key)
        return v === '42'
      } catch { return false }
    }, a.saveKey)
    expect(ok).toBe(true)
  })
}
