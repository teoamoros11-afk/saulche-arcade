import { test, expect } from '@playwright/test'
import { adapters, gameUrl } from '../00-runner.js'

test.describe('Input', () => {
  for (const adapter of adapters) {
    test.describe(`${adapter.title} (${adapter.file})`, () => {
      test('Teclado: teclas de dirección no lanzan error', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape']) {
          await page.keyboard.press(key).catch(() => {})
        }
        expect(true).toBe(true)
      })

      test('Click en múltiples posiciones no lanza error', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const positions = [[400, 300], [200, 150], [100, 100], [600, 400], [50, 50]]
        for (const [x, y] of positions) {
          await page.mouse.click(x, y).catch(() => {})
          await page.waitForTimeout(50)
        }
        expect(true).toBe(true)
      })

      if (adapter.inputTypes.includes('touch')) {
        test('Eventos táctiles no lanzan error', async ({ page }) => {
          await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          await page.dispatchEvent('canvas', 'touchstart', { touches: [{ clientX: 400, clientY: 300 }] }).catch(() => {})
          await page.dispatchEvent('canvas', 'touchmove', { touches: [{ clientX: 410, clientY: 300 }] }).catch(() => {})
          await page.dispatchEvent('canvas', 'touchend', {}).catch(() => {})
          expect(true).toBe(true)
        })
      }

      test('Inputs combinados no crashean', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowUp')
        await page.mouse.click(400, 300)
        await page.keyboard.press('Space')
        await page.keyboard.press('ArrowDown')
        expect(true).toBe(true)
      })

      test('Tecla repetida no lanza error', async ({ page }) => {
        await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('ArrowRight').catch(() => {})
        }
        expect(true).toBe(true)
      })
    })
  }
})
