import { GameAdapter } from '../../framework/GameAdapter.js'

export class PongAdapter extends GameAdapter {
  get file() { return 'pong.html' }
  get title() { return 'Pong' }
  get type() { return 'physics' }
  get saveKey() { return 'pong_grizzy' }
  get hasAI() { return true }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return true }
  get canvasId() { return 'c' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof level !== 'undefined') s.level = level
      if (typeof player !== 'undefined') {
        if (player.score !== undefined) s.score = player.score
      }
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
}
