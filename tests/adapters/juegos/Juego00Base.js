import { GameAdapter } from '../../framework/GameAdapter.js'

export function createJuegoAdapter(file, title, saveKey, overrides = {}) {
  return new (class extends GameAdapter {
    get file() { return file }
    get title() { return title }
    get type() { return overrides.type || 'platform' }
    get saveKey() { return saveKey }
    get hasAI() { return overrides.hasAI || false }
    get hasLevels() { return true }
    get inputTypes() { return ['keyboard', 'touch'] }
    get usesCanvas() { return true }
    get canvasId() { return overrides.canvasId || null }

    async getState(page) {
      return page.evaluate(() => {
        const s = {}
        if (typeof gameState !== 'undefined') s.gameState = gameState
        if (typeof state !== 'undefined') {
          if (typeof state === 'object' && state !== null) {
            if (state.level !== undefined) s.level = state.level
            if (state.score !== undefined) s.score = state.score
            if (state.phase !== undefined) s.phase = state.phase
            if (state.gameState !== undefined) s.gameState = state.gameState
            if (typeof state === 'object' && state !== null) Object.assign(s, state)
          } else {
            s.gameState = state
          }
        }
        if (typeof level !== 'undefined') s.level = level
        if (typeof score !== 'undefined') s.score = score
        if (typeof st !== 'undefined') s.gameState = st
        return Object.keys(s).length ? s : null
      })
    }

    async startGame(page) {
      // Most platform games auto-start or start on Enter/Space
      const btn = page.locator('button:has-text("Empezar"), button:has-text("Jugar"), button:has-text("Start"), #startBtn')
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(300)
      } else {
        await page.keyboard.press('Enter')
        await page.waitForTimeout(300)
        await page.keyboard.press('Space')
        await page.waitForTimeout(300)
      }
    }
  })()
}
