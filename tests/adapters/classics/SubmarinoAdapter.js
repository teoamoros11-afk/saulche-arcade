import { GameAdapter } from '../../framework/GameAdapter.js'

export class SubmarinoAdapter extends GameAdapter {
  get file() { return 'submarino.html' }
  get title() { return 'Submarino' }
  get type() { return 'physics' }
  get saveKey() { return 'submarino_grizzy' }
  get hasAI() { return true }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard', 'mouse'] }
  get usesCanvas() { return true }
  get canvasId() { return 'game' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof game !== 'undefined' && game) {
        if (game.score !== undefined) s.score = game.score
        if (game.level !== undefined) s.level = game.level
        if (game.state !== undefined) s.phase = game.state
        if (game.player && game.player.lives !== undefined) s.lives = game.player.lives
      }
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)
  }
}
