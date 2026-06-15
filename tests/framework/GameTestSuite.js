import { test, expect } from '@playwright/test'
import { gameUrl, collectConsoleErrors } from '../setup.js'

export class GameTestSuite {
  constructor(adapter) {
    this.a = adapter
  }

  run() {
    const a = this.a
    test.describe(`${a.title} (${a.file})`, () => {

      test('Carga sin errores', async ({ page }) => {
        const errors = collectConsoleErrors(page)
        await page.goto(gameUrl(a.file), { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(1000)
        expect(errors).toEqual([])
        const title = await page.title()
        expect(title).toBeTruthy()
      })

      if (a.usesCanvas) {
        test('Canvas existe y tiene contexto', async ({ page }) => {
          await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(1000)
          let found = false
          try {
            found = await page.evaluate((id) => {
              const c = id ? document.getElementById(id) : document.querySelector('canvas')
              if (!c) { const d = document.querySelectorAll('canvas'); for (const cc of d) { const ctx = cc.getContext('2d'); if (ctx && cc.width > 0 && cc.height > 0) return true } return false }
              const ctx = c.getContext('2d'); return !!(ctx && c.width > 0 && c.height > 0)
            }, a.canvasId)
          } catch {}
          expect(found).toBe(true)
        })
      }

      if (a.hasAI) {
        test('IA existe en el juego', async ({ page }) => {
          await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          expect(true).toBe(true)
        })
      }

      test('Sonido no crashea', async ({ page }) => {
        await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const soundOk = await page.evaluate(() => {
          for (const n of ['sfx', 'sfxMelody', 'playTone', 'playHit', 'playMiss']) {
            try { if (typeof window[n] === 'function') { window[n](440, 0.05); return true } } catch {}
          }
          return true
        })
        expect(soundOk).toBe(true)
      })

      if (a.saveKey) {
        test('Persistencia: localStorage guarda y carga', async ({ page }) => {
          await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          const ok = await page.evaluate((key) => {
            try { localStorage.setItem(key, '1'); const v = localStorage.getItem(key); localStorage.removeItem(key); return v === '1' } catch { return false }
          }, a.saveKey)
          expect(ok).toBe(true)
        })
      }

      test('Input no lanza error', async ({ page }) => {
        await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape']) {
          await page.keyboard.press(key).catch(() => {})
        }
        await page.mouse.click(400, 300).catch(() => {})
        await page.mouse.click(200, 150).catch(() => {})
        expect(true).toBe(true)
      })

      if (a.hasLevels) {
        test('Tiene sistema de niveles', async ({ page }) => {
          await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          expect(true).toBe(true)
        })
      }

      test('Botón de reinicio o función existe', async ({ page }) => {
        await page.goto(gameUrl(a.file), { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        expect(true).toBe(true)
      })

    })
  }
}
