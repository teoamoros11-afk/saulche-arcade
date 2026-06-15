import { GameAdapter } from '../../framework/GameAdapter.js'

export class FlappyGrizzyAdapter extends GameAdapter {
  get file() { return 'flappygrizzy.html' }
  get title() { return 'Flappy Grizzy' }
  get type() { return 'physics' }
  get saveKey() { return 'flappy_grizzy' }
  get hasAI() { return false }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard', 'touch'] }
  get usesCanvas() { return true }
  get canvasId() { return 'c' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof score !== 'undefined') s.score = score
      if (typeof level !== 'undefined') s.level = level
      if (typeof gameOver !== 'undefined') s.gameOver = gameOver
      if (typeof started !== 'undefined') s.started = started
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)
  }
}
